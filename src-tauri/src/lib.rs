use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Serialize, Debug, PartialEq)]
pub struct WorkspaceFileInfo {
    pub path: String,
    pub name: String,
    pub content: String,
}

#[derive(Serialize, Debug, PartialEq)]
pub struct WorkspaceTreeNode {
    pub id: String,
    pub name: String,
    pub path: String,
    pub kind: String,
    pub is_dashboard: bool,
    pub children: Option<Vec<WorkspaceTreeNode>>,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("Failed to read file '{}': {}", path, e))
}

#[tauri::command]
fn write_file(path: String, content: String) -> Result<(), String> {
    if let Some(parent) = Path::new(&path).parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create parent directory for '{}': {}", path, e))?;
        }
    }
    fs::write(&path, content).map_err(|e| format!("Failed to write file '{}': {}", path, e))
}

fn collect_workspace_files(dir_path: &Path, results: &mut Vec<WorkspaceFileInfo>) -> std::io::Result<()> {
    if !dir_path.exists() || !dir_path.is_dir() {
        return Ok(());
    }

    let entries = fs::read_dir(dir_path)?;
    for entry in entries.flatten() {
        let path = entry.path();
        let name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");
        if name.starts_with('.') || name == "node_modules" || name == "target" || name == "dist" {
            continue;
        }

        if path.is_dir() {
            collect_workspace_files(&path, results)?;
        } else if path.is_file() {
            if let Some(ext) = path.extension() {
                if ext == "md" {
                    if let Ok(content) = fs::read_to_string(&path) {
                        let path_str = path.to_str().unwrap_or("").replace('\\', "/");
                        results.push(WorkspaceFileInfo {
                            path: path_str,
                            name: name.to_string(),
                            content,
                        });
                    }
                }
            }
        }
    }
    Ok(())
}

#[tauri::command]
fn read_workspace_files(dir_path: String) -> Result<Vec<WorkspaceFileInfo>, String> {
    let mut results = Vec::new();
    let dir_path_buf = Path::new(&dir_path);

    if !dir_path_buf.exists() {
        let _ = fs::create_dir_all(dir_path_buf);
    }

    collect_workspace_files(dir_path_buf, &mut results)
        .map_err(|e| format!("Failed to read workspace files in '{}': {}", dir_path, e))?;

    Ok(results)
}

fn scan_directory_tree(dir_path: &Path) -> std::io::Result<Vec<WorkspaceTreeNode>> {
    let mut nodes = Vec::new();
    if !dir_path.exists() || !dir_path.is_dir() {
        return Ok(nodes);
    }

    let mut entries: Vec<_> = fs::read_dir(dir_path)?.flatten().collect();
    entries.sort_by_key(|e| e.path());

    for entry in entries {
        let path = entry.path();
        let name = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("")
            .to_string();

        if name.starts_with('.') || name == "node_modules" || name == "target" || name == "dist" {
            continue;
        }

        let path_str = path.to_str().unwrap_or("").replace('\\', "/");

        if path.is_dir() {
            let children = scan_directory_tree(&path)?;
            nodes.push(WorkspaceTreeNode {
                id: path_str.clone(),
                name,
                path: path_str,
                kind: "folder".to_string(),
                is_dashboard: false,
                children: Some(children),
            });
        } else if path.is_file() {
            let is_md = path.extension().and_then(|e| e.to_str()) == Some("md");
            if is_md {
                let is_dashboard = name.ends_with(".dashboard.md");
                let kind = if is_dashboard {
                    "dashboard"
                } else {
                    "file"
                };
                nodes.push(WorkspaceTreeNode {
                    id: path_str.clone(),
                    name,
                    path: path_str,
                    kind: kind.to_string(),
                    is_dashboard,
                    children: None,
                });
            }
        }
    }

    Ok(nodes)
}

#[tauri::command]
fn read_workspace_tree(dir_path: String) -> Result<Vec<WorkspaceTreeNode>, String> {
    let dir_path_buf = Path::new(&dir_path);
    if !dir_path_buf.exists() {
        let _ = fs::create_dir_all(dir_path_buf);
    }

    scan_directory_tree(dir_path_buf)
        .map_err(|e| format!("Failed to read workspace tree for '{}': {}", dir_path, e))
}

#[tauri::command]
fn get_workspace_dir(app_handle: tauri::AppHandle) -> Result<String, String> {
    use tauri::Manager;
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    let workspace_dir = app_data_dir.join("workspace");
    if !workspace_dir.exists() {
        fs::create_dir_all(&workspace_dir)
            .map_err(|e| format!("Failed to create workspace dir: {}", e))?;
    }
    // Seed a default note if the workspace is completely empty
    let is_empty = fs::read_dir(&workspace_dir)
        .map(|mut entries| entries.next().is_none())
        .unwrap_or(true);
    if is_empty {
        let default_note = workspace_dir.join("workspace-note.md");
        let initial_content = "# Workspace Project Roadmap\n\nWelcome to the Rosé Pine Moon Soho Vault app. Tasks within plain Markdown files are automatically aggregated into the Task Dashboard on the left sidebar.\n\n## Immediate Milestones\n\n- [x] Set up Dual Column layout shell with Rosé Pine tokens\n- [-] Integrate Tauri file system commands for reading/writing markdown\n- [ ] Lexical editor Markdown transformer & DecoratorNode integration\n- [>] Custom interactive checklist portal node renderer\n";
        let _ = fs::write(&default_note, initial_content);
    }
    let path_str = workspace_dir
        .to_str()
        .ok_or_else(|| "Invalid workspace path".to_string())?
        .replace('\\', "/");
    Ok(path_str)
}

#[tauri::command]
fn create_folder(path: String) -> Result<(), String> {
    fs::create_dir_all(&path).map_err(|e| format!("Failed to create folder '{}': {}", path, e))
}

#[tauri::command]
fn delete_path(path: String) -> Result<(), String> {
    let p = Path::new(&path);
    if !p.exists() {
        return Ok(());
    }
    if p.is_dir() {
        fs::remove_dir_all(p).map_err(|e| format!("Failed to delete folder '{}': {}", path, e))
    } else {
        fs::remove_file(p).map_err(|e| format!("Failed to delete file '{}': {}", path, e))
    }
}

#[tauri::command]
fn rename_path(old_path: String, new_path: String) -> Result<(), String> {
    if let Some(parent) = Path::new(&new_path).parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create parent directory for '{}': {}", new_path, e))?;
        }
    }
    fs::rename(&old_path, &new_path)
        .map_err(|e| format!("Failed to rename path '{}' to '{}': {}", old_path, new_path, e))
}

fn copy_folder_recursive(src: &Path, dst: &Path) -> Result<u32, String> {
    if !src.exists() || !src.is_dir() {
        return Err(format!("Source path '{}' is not a valid directory", src.display()));
    }
    fs::create_dir_all(dst).map_err(|e| format!("Failed to create directory '{}': {}", dst.display(), e))?;

    let mut count = 0;
    let entries = fs::read_dir(src).map_err(|e| format!("Failed to read dir '{}': {}", src.display(), e))?;

    for entry in entries.flatten() {
        let entry_path = entry.path();
        let file_name = entry_path.file_name().unwrap_or_default();
        if file_name.to_str().map_or(false, |s| s.starts_with('.')) {
            continue;
        }

        if entry_path.is_dir() {
            let target_sub_dir = dst.join(file_name);
            count += copy_folder_recursive(&entry_path, &target_sub_dir)?;
        } else if entry_path.is_file() {
            let target_file_name = if let Some(ext) = entry_path.extension() {
                if ext.to_string_lossy().eq_ignore_ascii_case("txt") {
                    let stem = entry_path.file_stem().unwrap_or_default().to_string_lossy();
                    format!("{}.md", stem)
                } else {
                    file_name.to_string_lossy().to_string()
                }
            } else {
                file_name.to_string_lossy().to_string()
            };

            let target_file_path = dst.join(target_file_name);
            fs::copy(&entry_path, &target_file_path)
                .map_err(|e| format!("Failed to copy file from '{}' to '{}': {}", entry_path.display(), target_file_path.display(), e))?;
            count += 1;
        }
    }
    Ok(count)
}

#[tauri::command]
fn import_folder(source_path: Option<String>, target_workspace_dir: String) -> Result<u32, String> {
    let src_buf = match source_path {
        Some(ref path) if !path.trim().is_empty() => PathBuf::from(path),
        _ => match rfd::FileDialog::new().pick_folder() {
            Some(path) => path,
            None => return Ok(0), // User canceled selection
        },
    };

    let folder_name = src_buf
        .file_name()
        .ok_or_else(|| "Invalid source folder name".to_string())?;

    let destination = Path::new(&target_workspace_dir).join(folder_name);
    copy_folder_recursive(&src_buf, &destination)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            use tauri::menu::{Menu, MenuItem};
            use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
            use tauri::{Emitter, Manager};

            let show_i = MenuItem::with_id(app, "show", "Open Vault", true, None::<&str>)?;
            let quick_switcher_i = MenuItem::with_id(app, "quick_switcher", "Quick Switcher", true, None::<&str>)?;
            let new_note_i = MenuItem::with_id(app, "new_note", "New Note", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &quick_switcher_i, &new_note_i, &quit_i])?;

            let mut builder = TrayIconBuilder::new()
                .menu(&menu)
                .tooltip("Vault")
                .on_menu_event(|app, event| {
                    match event.id.as_ref() {
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.unminimize();
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        "quick_switcher" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.unminimize();
                                let _ = window.show();
                                let _ = window.set_focus();
                                let _ = window.emit("tray-quick-switcher", ());
                            }
                        }
                        "new_note" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.unminimize();
                                let _ = window.show();
                                let _ = window.set_focus();
                                let _ = window.emit("tray-new-note", ());
                            }
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) && !window.is_minimized().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let _ = window.unminimize();
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                });

            if let Some(icon) = app.default_window_icon() {
                builder = builder.icon(icon.clone());
            }

            let _tray = builder.build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            read_file,
            write_file,
            read_workspace_files,
            read_workspace_tree,
            create_folder,
            delete_path,
            rename_path,
            get_workspace_dir,
            import_folder
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use tempfile::NamedTempFile;

    #[test]
    fn test_read_and_write_file() {
        let mut temp_file = NamedTempFile::new().unwrap();
        let path_str = temp_file.path().to_str().unwrap().to_string();

        let initial_content = "# Test Document\n- [ ] Task 1\n";
        temp_file.write_all(initial_content.as_bytes()).unwrap();

        let read_res = read_file(path_str.clone());
        assert!(read_res.is_ok());
        assert_eq!(read_res.unwrap(), initial_content);

        let new_content = "# Test Document\n- [x] Task 1 completed\n";
        let write_res = write_file(path_str.clone(), new_content.to_string());
        assert!(write_res.is_ok());

        let read_after = read_file(path_str);
        assert!(read_after.is_ok());
        assert_eq!(read_after.unwrap(), new_content);
    }

    #[test]
    fn test_read_workspace_files_recursive() {
        let temp_dir = tempfile::tempdir().unwrap();
        let sub_dir = temp_dir.path().join("Projects");
        fs::create_dir_all(&sub_dir).unwrap();

        let file1_path = temp_dir.path().join("note1.md");
        let file2_path = sub_dir.join("note2.md");
        let txt_path = temp_dir.path().join("ignore.txt");

        fs::write(&file1_path, "# Note 1\n- [ ] Task A").unwrap();
        fs::write(&file2_path, "# Note 2\n- [x] Task B").unwrap();
        fs::write(&txt_path, "not a markdown file").unwrap();

        let res = read_workspace_files(temp_dir.path().to_str().unwrap().to_string());
        assert!(res.is_ok());
        let files = res.unwrap();
        assert_eq!(files.len(), 2);
        assert!(files.iter().any(|f| f.name == "note1.md"));
        assert!(files.iter().any(|f| f.name == "note2.md"));
    }

    #[test]
    fn test_workspace_tree_and_folder_crud() {
        let temp_dir = tempfile::tempdir().unwrap();
        let dir_str = temp_dir.path().to_str().unwrap().to_string();

        // 1. Create folder
        let folder_path = temp_dir.path().join("Projects");
        let folder_str = folder_path.to_str().unwrap().to_string();
        assert!(create_folder(folder_str.clone()).is_ok());

        // 2. Create file in folder
        let file_path = folder_path.join("task.md");
        let file_str = file_path.to_str().unwrap().to_string();
        assert!(write_file(file_str.clone(), "# Task".to_string()).is_ok());

        // 3. Read tree
        let tree_res = read_workspace_tree(dir_str.clone());
        assert!(tree_res.is_ok());
        let tree = tree_res.unwrap();
        assert_eq!(tree.len(), 1);
        assert_eq!(tree[0].name, "Projects");
        assert_eq!(tree[0].kind, "folder");
        let children = tree[0].children.as_ref().unwrap();
        assert_eq!(children.len(), 1);
        assert_eq!(children[0].name, "task.md");

        // 4. Rename file
        let renamed_file_path = folder_path.join("renamed_task.md");
        let renamed_file_str = renamed_file_path.to_str().unwrap().to_string();
        assert!(rename_path(file_str.clone(), renamed_file_str.clone()).is_ok());
        assert!(!file_path.exists());
        assert!(renamed_file_path.exists());

        // 5. Delete path
        assert!(delete_path(folder_str.clone()).is_ok());
        assert!(!folder_path.exists());
    }

    #[test]
    fn test_copy_folder_recursive_with_txt_conversion() {
        let temp_src = tempfile::tempdir().unwrap();
        let temp_dst = tempfile::tempdir().unwrap();

        let sub_dir = temp_src.path().join("Notes");
        fs::create_dir_all(&sub_dir).unwrap();

        let txt_file = temp_src.path().join("todo.txt");
        let md_file = temp_src.path().join("readme.md");
        let sub_txt = sub_dir.join("journal.TXT");

        fs::write(&txt_file, "text file content").unwrap();
        fs::write(&md_file, "markdown file content").unwrap();
        fs::write(&sub_txt, "sub text content").unwrap();

        let target_dir = temp_dst.path().join("ImportedFolder");
        let count = copy_folder_recursive(temp_src.path(), &target_dir).unwrap();
        assert_eq!(count, 3);

        assert!(target_dir.join("todo.md").exists());
        assert!(!target_dir.join("todo.txt").exists());
        assert_eq!(fs::read_to_string(target_dir.join("todo.md")).unwrap(), "text file content");

        assert!(target_dir.join("readme.md").exists());
        assert_eq!(fs::read_to_string(target_dir.join("readme.md")).unwrap(), "markdown file content");

        assert!(target_dir.join("Notes").join("journal.md").exists());
        assert_eq!(fs::read_to_string(target_dir.join("Notes").join("journal.md")).unwrap(), "sub text content");
    }
}




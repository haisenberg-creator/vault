use serde::Serialize;
use std::fs;
use std::path::Path;

#[derive(Serialize, Debug, PartialEq)]
pub struct WorkspaceFileInfo {
    pub path: String,
    pub name: String,
    pub content: String,
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
    fs::write(&path, content).map_err(|e| format!("Failed to write file '{}': {}", path, e))
}

#[tauri::command]
fn read_workspace_files(dir_path: String) -> Result<Vec<WorkspaceFileInfo>, String> {
    let mut results = Vec::new();
    let dir_path_buf = Path::new(&dir_path);

    if !dir_path_buf.exists() || !dir_path_buf.is_dir() {
        return Err(format!("Directory '{}' does not exist or is not a directory", dir_path));
    }

    let entries = fs::read_dir(dir_path_buf)
        .map_err(|e| format!("Failed to read directory '{}': {}", dir_path, e))?;

    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_file() {
            if let Some(ext) = path.extension() {
                if ext == "md" {
                    if let Ok(content) = fs::read_to_string(&path) {
                        let name = path
                            .file_name()
                            .and_then(|n| n.to_str())
                            .unwrap_or("")
                            .to_string();
                        let path_str = path.to_str().unwrap_or("").to_string();
                        results.push(WorkspaceFileInfo {
                            path: path_str,
                            name,
                            content,
                        });
                    }
                }
            }
        }
    }

    Ok(results)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            read_file,
            write_file,
            read_workspace_files
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
    fn test_read_workspace_files() {
        let temp_dir = tempfile::tempdir().unwrap();
        let file1_path = temp_dir.path().join("note1.md");
        let file2_path = temp_dir.path().join("note2.md");
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
}



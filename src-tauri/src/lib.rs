use std::fs;

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, read_file, write_file])
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
}


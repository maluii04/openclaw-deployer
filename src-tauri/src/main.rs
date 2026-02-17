#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use std::process::Command;
use std::env;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
struct CheckResult {
    name: String,
    installed: bool,
    version: Option<String>,
    required: bool,
    can_auto_install: bool,
    install_url: String,
    install_guide: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct SystemReport {
    platform: String,
    all_ready: bool,
    checks: Vec<CheckResult>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct InstallResult {
    success: bool,
    message: String,
}

// 检查 Docker
#[tauri::command]
async fn check_docker() -> Result<CheckResult, String> {
    let platform = env::consts::OS;
    
    let output = Command::new("docker").arg("--version").output();
    
    let (installed, version) = match output {
        Ok(output) if output.status.success() => {
            let ver = String::from_utf8_lossy(&output.stdout);
            (true, Some(ver.trim().to_string()))
        }
        _ => (false, None),
    };
    
    let install_url = if platform == "macos" {
        "https://docs.docker.com/desktop/install/mac-install/".to_string()
    } else {
        "https://www.docker.com/products/docker-desktop".to_string()
    };
    
    let install_guide = if platform == "macos" {
        vec![
            "1. 下载 Docker Desktop for Mac".to_string(),
            "2. 打开 .dmg 文件".to_string(),
            "3. 将 Docker 拖到 Applications".to_string(),
            "4. 启动 Docker Desktop 并等待初始化".to_string(),
        ]
    } else {
        vec![
            "1. 下载 Docker Desktop for Windows".to_string(),
            "2. 运行安装程序".to_string(),
            "3. 按提示完成安装".to_string(),
            "4. 启动 Docker Desktop".to_string(),
        ]
    };
    
    Ok(CheckResult {
        name: "Docker".to_string(),
        installed,
        version,
        required: true,
        can_auto_install: true,
        install_url,
        install_guide,
    })
}

// 检查 Docker Compose
#[tauri::command]
async fn check_docker_compose() -> Result<CheckResult, String> {
    let platform = env::consts::OS;
    
    // 尝试新版 docker compose
    let output = Command::new("docker").args(&["compose", "version"]).output();
    
    let (installed, version) = match output {
        Ok(output) if output.status.success() => {
            let ver = String::from_utf8_lossy(&output.stdout);
            (true, Some(ver.trim().to_string()))
        }
        _ => {
            // 尝试旧版 docker-compose
            let output = Command::new("docker-compose").arg("--version").output();
            match output {
                Ok(output) if output.status.success() => {
                    let ver = String::from_utf8_lossy(&output.stdout);
                    (true, Some(ver.trim().to_string()))
                }
                _ => (false, None),
            }
        }
    };
    
    Ok(CheckResult {
        name: "Docker Compose".to_string(),
        installed,
        version,
        required: true,
        can_auto_install: false, // 随 Docker 一起安装
        install_url: if platform == "macos" {
            "https://docs.docker.com/desktop/install/mac-install/".to_string()
        } else {
            "https://www.docker.com/products/docker-desktop".to_string()
        },
        install_guide: vec![
            "Docker Compose 随 Docker Desktop 一起安装".to_string(),
            "请先安装 Docker Desktop".to_string(),
        ],
    })
}

// 检查 Git
#[tauri::command]
async fn check_git() -> Result<CheckResult, String> {
    let platform = env::consts::OS;
    
    let output = Command::new("git").arg("--version").output();
    
    let (installed, version) = match output {
        Ok(output) if output.status.success() => {
            let ver = String::from_utf8_lossy(&output.stdout);
            (true, Some(ver.trim().to_string()))
        }
        _ => (false, None),
    };
    
    let install_url = if platform == "macos" {
        "https://git-scm.com/download/mac".to_string()
    } else {
        "https://git-scm.com/download/win".to_string()
    };
    
    let install_guide = if platform == "macos" {
        vec![
            "方式1: brew install git".to_string(),
            "方式2: 从官网下载安装包".to_string(),
        ]
    } else {
        vec![
            "1. 从官网下载安装程序".to_string(),
            "2. 运行安装程序".to_string(),
        ]
    };
    
    Ok(CheckResult {
        name: "Git".to_string(),
        installed,
        version,
        required: false,
        can_auto_install: false,
        install_url,
        install_guide,
    })
}

// 完整系统检测
#[tauri::command]
async fn check_all_requirements() -> Result<SystemReport, String> {
    let docker = check_docker().await?;
    let docker_compose = check_docker_compose().await?;
    let git = check_git().await?;
    
    let checks = vec![docker, docker_compose, git];
    
    let all_ready = checks.iter()
        .filter(|c| c.required)
        .all(|c| c.installed);
    
    Ok(SystemReport {
        platform: env::consts::OS.to_string(),
        all_ready,
        checks,
    })
}

// 自动安装 Docker (Mac)
#[tauri::command]
async fn auto_install_docker() -> Result<InstallResult, String> {
    let platform = env::consts::OS;
    
    if platform != "macos" {
        return Ok(InstallResult {
            success: false,
            message: "自动安装仅支持 macOS".to_string(),
        });
    }
    
    let arch = env::consts::ARCH;
    let docker_url = if arch == "aarch64" || arch == "arm64" {
        "https://desktop.docker.com/mac/main/arm64/Docker.dmg"
    } else {
        "https://desktop.docker.com/mac/main/amd64/Docker.dmg"
    };
    
    // 下载 Docker
    let download_result = Command::new("curl")
        .args(&["-L", "-o", "/tmp/Docker.dmg", docker_url])
        .output();
    
    if download_result.is_err() {
        return Ok(InstallResult {
            success: false,
            message: "下载失败，请检查网络".to_string(),
        });
    }
    
    // 挂载 DMG
    let _ = Command::new("hdiutil")
        .args(&["attach", "/tmp/Docker.dmg", "-nobrowse", "-quiet"])
        .output();
    
    // 复制到 Applications
    let copy_result = Command::new("cp")
        .args(&["-R", "/Volumes/Docker/Docker.app", "/Applications/"])
        .output();
    
    // 清理
    let _ = Command::new("hdiutil")
        .args(&["detach", "/Volumes/Docker", "-quiet"])
        .output();
    let _ = Command::new("rm")
        .args(&["-f", "/tmp/Docker.dmg"])
        .output();
    
    if copy_result.is_ok() {
        // 启动 Docker
        let _ = Command::new("open")
            .args(&["-a", "/Applications/Docker.app"])
            .spawn();
        
        Ok(InstallResult {
            success: true,
            message: "Docker 安装成功！正在启动...".to_string(),
        })
    } else {
        Ok(InstallResult {
            success: false,
            message: "安装失败".to_string(),
        })
    }
}

// 打开外部链接
#[tauri::command]
fn open_external(url: &str) -> Result<(), String> {
    match open::that(url) {
        Ok(_) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

// 获取平台信息
#[tauri::command]
fn get_platform() -> String {
    env::consts::OS.to_string()
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            check_docker,
            check_docker_compose,
            check_git,
            check_all_requirements,
            auto_install_docker,
            open_external,
            get_platform
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

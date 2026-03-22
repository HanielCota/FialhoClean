use crate::errors::AppError;
use winreg::enums::*;
use winreg::RegKey;

/// Extension trait that eliminates the repeated `.map_err(|e| AppError::Registry(...))?`
/// pattern across registry operations.
pub trait RegistryExt {
    /// Read a DWORD as bool (nonzero = true). Returns `default` if key/value missing.
    fn read_bool(&self, path: &str, name: &str, default: bool) -> bool;

    /// Read a DWORD. Returns `default` if key/value missing.
    fn read_u32(&self, path: &str, name: &str, default: u32) -> u32;

    /// Read a REG_SZ string. Returns `default` if key/value missing.
    fn read_string(&self, path: &str, name: &str, default: &str) -> String;

    /// Write a DWORD value, creating the subkey if needed.
    fn write_u32(&self, path: &str, name: &str, val: u32) -> Result<(), AppError>;

    /// Write a REG_SZ string value, creating the subkey if needed.
    fn write_string(&self, path: &str, name: &str, val: &str) -> Result<(), AppError>;

    /// Open a subkey with KEY_SET_VALUE flags for writing.
    fn open_write(&self, path: &str) -> Result<RegKey, AppError>;
}

impl RegistryExt for RegKey {
    fn read_bool(&self, path: &str, name: &str, default: bool) -> bool {
        self.open_subkey(path)
            .and_then(|k| k.get_value::<u32, _>(name))
            .map(|v| v != 0)
            .unwrap_or(default)
    }

    fn read_u32(&self, path: &str, name: &str, default: u32) -> u32 {
        self.open_subkey(path)
            .and_then(|k| k.get_value::<u32, _>(name))
            .unwrap_or(default)
    }

    fn read_string(&self, path: &str, name: &str, default: &str) -> String {
        self.open_subkey(path)
            .and_then(|k| k.get_value::<String, _>(name))
            .unwrap_or_else(|_| default.to_string())
    }

    fn write_u32(&self, path: &str, name: &str, val: u32) -> Result<(), AppError> {
        let (key, _) = self
            .create_subkey(path)
            .map_err(|e| AppError::Registry(e.to_string()))?;
        key.set_value(name, &val)
            .map_err(|e| AppError::Registry(e.to_string()))
    }

    fn write_string(&self, path: &str, name: &str, val: &str) -> Result<(), AppError> {
        let (key, _) = self
            .create_subkey(path)
            .map_err(|e| AppError::Registry(e.to_string()))?;
        key.set_value(name, &val)
            .map_err(|e| AppError::Registry(e.to_string()))
    }

    fn open_write(&self, path: &str) -> Result<RegKey, AppError> {
        self.open_subkey_with_flags(path, KEY_SET_VALUE)
            .map_err(|e| AppError::Registry(e.to_string()))
    }
}

/// Shorthand for HKEY_CURRENT_USER.
pub fn hkcu() -> RegKey {
    RegKey::predef(HKEY_CURRENT_USER)
}

/// Shorthand for HKEY_LOCAL_MACHINE.
pub fn hklm() -> RegKey {
    RegKey::predef(HKEY_LOCAL_MACHINE)
}

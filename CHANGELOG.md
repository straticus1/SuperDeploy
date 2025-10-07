# Changelog

All notable changes to SuperDeploy will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.2] - 2025-10-07

### Enhanced
- **Build Configuration**: Updated build.lst with improved project management
  - Enhanced project tracking and build configuration
  - Better project dependency management
  - Improved build process optimization
- **Logging System**: Enhanced logging capabilities
  - Extended log retention for better debugging
  - Improved log rotation and management
  - Enhanced error tracking and reporting
  - Added detailed deployment logging for October activities

### Fixed
- **Build Process**: Resolved build configuration issues
  - Fixed build.lst format and structure
  - Improved build process reliability
  - Enhanced error handling during build operations
- **Log Management**: Improved log file handling
  - Fixed log rotation and cleanup processes
  - Better log file organization and archival
  - Enhanced log search and filtering capabilities

### Technical Improvements
- **Performance**: Optimized deployment processes
- **Reliability**: Enhanced error recovery and rollback procedures
- **Monitoring**: Improved deployment tracking and status reporting
- **Documentation**: Updated deployment guides and troubleshooting

## [2.0.1] - 2025-09-20

### Fixed
- **Deployment Detection Priority**: Corrected logical hierarchy to match real-world deployment patterns:
  1. Custom deployment scripts (orchestrate everything)
  2. Terraform (usually orchestrates Ansible)
  3. Ansible (standalone configuration management)
  4. Error if none found
- **Python Script Support**: Added support for `.py` deployment scripts with automatic `python3` execution
- **Help Documentation**: Updated help text to reflect correct detection priority

## [2.0.0] - 2025-09-20

### Added
- **Smart Deployment Detection**: Automatically detects custom deployment scripts and standard terraform/ansible directories
- **Custom Script Integration**: Full support for project-specific deployment systems (e.g., `scripts/deploy/master-deploy.sh`)
- **New Commands**:
  - `plan <project>` - Show deployment plan without making changes
  - Enhanced `deploy <project> [options]` - Support for deployment options
- **Deployment Options**:
  - `--plan-only` - Show plan without making changes
  - `--infrastructure-only` - Deploy infrastructure only
  - `--application-only` - Deploy application only
  - `--verbose` - Verbose output
- **Enhanced Project Detection**: Searches for deployment scripts in multiple common locations:
  - `scripts/deploy/master-deploy.sh`
  - `scripts/deploy/deploy.sh`
  - `deploy/master-deploy.sh`
  - `deploy/deploy.sh`
  - `bin/deploy.sh`
  - `deploy.sh`
- **Improved Error Handling**: Better error messages and troubleshooting guidance
- **Enhanced Status Checking**: Detailed project status with deployment system detection

### Changed
- **Breaking**: Deployment logic now prioritizes custom deployment scripts over standard terraform/ansible
- **Improved**: `check` command now provides detailed information about detected deployment systems
- **Enhanced**: Help system with comprehensive option documentation
- **Better**: Logging and user feedback throughout deployment process

### Fixed
- Projects with custom deployment systems (like 9lives.xyz) now deploy correctly instead of being skipped
- No more false "Successfully deployed" messages when no actual deployment occurred
- Better detection of project deployment capabilities

## [1.0.0] - Initial Release

### Added
- Basic project management (add, remove, list)
- Terraform deployment support
- Ansible deployment support with multiple configuration formats
- Project lifecycle management (deploy, teardown, refresh, check)
- Comprehensive logging with daily rotation
- Basic error handling and validation
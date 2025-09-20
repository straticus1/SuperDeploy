# Changelog

All notable changes to SuperDeploy will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
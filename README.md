# SuperDeploy

A unified deployment system that intelligently manages infrastructure and application deployments across multiple projects. SuperDeploy automatically detects and integrates with both custom deployment systems and standard Terraform/Ansible workflows.

## Overview

SuperDeploy provides a centralized way to manage deployment workflows across diverse project types. It intelligently detects project-specific deployment systems (like custom deployment scripts) and falls back to standard Infrastructure as Code (IaC) patterns with Terraform and Ansible when needed.

## Features

- **🧠 Smart Deployment Detection**: Automatically detects custom deployment scripts and standard terraform/ansible directories
- **🔧 Custom Script Integration**: Full support for project-specific deployment systems (e.g., `scripts/deploy/master-deploy.sh`)
- **🚀 Multi-Project Management**: Manage deployments across multiple projects from a single interface
- **📋 Deployment Planning**: Preview deployment changes with `--plan-only` before execution
- **🎯 Targeted Deployments**: Deploy infrastructure-only or application-only with granular control
- **⚙️ Terraform Integration**: Automatic Terraform initialization and deployment
- **📖 Ansible Integration**: Flexible Ansible playbook execution with multiple configuration formats
- **🔄 Project Lifecycle**: Deploy, teardown, refresh, and check status of projects
- **📊 Enhanced Status Checking**: Detailed project status with deployment system detection
- **📝 Comprehensive Logging**: Timestamped entries with detailed deployment tracking
- **🏗️ Flexible Configuration**: Supports various project structures and naming conventions

## Quick Start

```bash
# List all managed projects
./superdeploy list

# Add a new project to management
./superdeploy add myproject

# Check what deployment system a project uses
./superdeploy check myproject

# Preview deployment plan (dry run)
./superdeploy plan myproject

# Deploy a project
./superdeploy deploy myproject

# Deploy with options
./superdeploy deploy myproject --infrastructure-only
./superdeploy deploy myproject --verbose

# Teardown a project
./superdeploy teardown myproject

# Refresh (teardown + deploy) a project
./superdeploy refresh myproject
```

## Project Structure

SuperDeploy intelligently detects and supports multiple project structures:

### Custom Deployment Systems (Preferred)

For projects with sophisticated deployment needs:

```
/Users/ryan/development/
├── project1/
│   ├── scripts/
│   │   └── deploy/
│   │       ├── master-deploy.sh    # ← SuperDeploy will use this!
│   │       ├── build-and-push.sh
│   │       └── deploy-infrastructure.sh
│   ├── terraform/
│   ├── ansible/
│   └── ...
└── project2/
    ├── deploy.sh              # ← Or this!
    └── ...
```

### Standard Structure (Fallback)

For simple terraform/ansible projects:

```
/Users/ryan/development/
├── project3/
│   ├── terraform/          # Terraform configuration files
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── ...
│   └── ansible/            # Ansible configuration
│       ├── deploy.yml      # OR playbook.yml OR site.yml
│       ├── inventory.yml   # OR inventory/ directory
│       └── ...
└── ...
```

### Custom Script Detection Order

SuperDeploy searches for deployment scripts in this order:
1. `scripts/deploy/master-deploy.sh`
2. `scripts/deploy/deploy.sh`
3. `deploy/master-deploy.sh`
4. `deploy/deploy.sh`
5. `bin/deploy.sh`
6. `deploy.sh`

## Supported Ansible Configurations

SuperDeploy automatically detects and supports multiple Ansible configurations:

1. **Modern Structure**: `deploy.yml` + `inventory.yml`
2. **Alternative Structure**: `playbook.yml` + `inventory.yml`
3. **Traditional Structure**: `site.yml` + `inventory/production`

## Commands

### Core Commands

| Command | Description |
|---------|-------------|
| `list` | List all managed projects |
| `add <project>` | Add a new project to the build list |
| `remove <project>` | Remove a project from the build list |
| `check <project>` | Check project status and detect deployment system |
| `help` | Show help message |

### Deployment Commands

| Command | Description |
|---------|-------------|
| `plan <project>` | Show deployment plan without making changes |
| `deploy <project> [options]` | Deploy a project (with optional parameters) |
| `teardown <project>` | Destroy project resources |
| `refresh <project>` | Teardown and redeploy a project |

### Deployment Options

| Option | Description |
|--------|-------------|
| `--plan-only` | Show plan without making changes |
| `--infrastructure-only` | Deploy infrastructure only |
| `--application-only` | Deploy application only |
| `--verbose` | Verbose output |

### Examples

```bash
# Preview what will be deployed
./superdeploy plan myproject

# Deploy everything
./superdeploy deploy myproject

# Deploy only infrastructure
./superdeploy deploy myproject --infrastructure-only

# Deploy with detailed output
./superdeploy deploy myproject --verbose

# Check what deployment system is detected
./superdeploy check myproject
```

## Requirements

- Bash shell
- Terraform
- Ansible
- jq

## Installation

See [docs/INSTALL.md](docs/INSTALL.md) for detailed installation instructions.

## Troubleshooting

See [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for common issues and solutions.

## Logging

SuperDeploy automatically creates logs in the `logs/` directory with daily rotation:
- Log file format: `logs/superdeploy_YYYYMMDD.log`
- Logs include timestamps, levels (INFO, WARN, ERROR), and detailed messages

## Version

Current version: 2.0.0

See [CHANGELOG.md](CHANGELOG.md) for detailed version history and changes.

## License

This project is released under the MIT License.
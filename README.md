# SuperDeploy

A unified deployment system that wraps around Ansible and Terraform jobs for managing infrastructure and applications across multiple projects.

## Overview

SuperDeploy provides a centralized way to manage deployment workflows for projects that use Infrastructure as Code (IaC) with Terraform and configuration management with Ansible. It automatically detects project structures and executes the appropriate deployment commands.

## Features

- **Multi-Project Management**: Manage deployments across multiple projects from a single interface
- **Terraform Integration**: Automatic Terraform initialization and deployment
- **Ansible Integration**: Flexible Ansible playbook execution with multiple configuration formats
- **Project Lifecycle**: Deploy, teardown, refresh, and check status of projects
- **Logging**: Comprehensive logging with timestamped entries
- **Flexible Configuration**: Supports various project structures and naming conventions

## Quick Start

```bash
# List all managed projects
./superdeploy list

# Add a new project to management
./superdeploy add myproject

# Deploy a project
./superdeploy deploy myproject

# Check project status
./superdeploy check myproject

# Teardown a project
./superdeploy teardown myproject

# Refresh (teardown + deploy) a project
./superdeploy refresh myproject
```

## Project Structure

SuperDeploy expects projects to be organized in the following structure:

```
/Users/ryan/development/
├── project1/
│   ├── terraform/          # Terraform configuration files
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── ...
│   └── ansible/            # Ansible configuration
│       ├── deploy.yml      # OR playbook.yml OR site.yml
│       ├── inventory.yml   # OR inventory/ directory
│       └── ...
├── project2/
└── ...
```

## Supported Ansible Configurations

SuperDeploy automatically detects and supports multiple Ansible configurations:

1. **Modern Structure**: `deploy.yml` + `inventory.yml`
2. **Alternative Structure**: `playbook.yml` + `inventory.yml`
3. **Traditional Structure**: `site.yml` + `inventory/production`

## Commands

| Command | Description |
|---------|-------------|
| `list` | List all managed projects |
| `add <project>` | Add a new project to the build list |
| `remove <project>` | Remove a project from the build list |
| `deploy <project>` | Deploy a project (Terraform + Ansible) |
| `teardown <project>` | Destroy project resources (Terraform only) |
| `check <project>` | Check project status |
| `refresh <project>` | Teardown and redeploy a project |
| `help` | Show help message |

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

Current version: 1.0.0

## License

This project is released under the MIT License.
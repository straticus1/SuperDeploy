# Installation Guide

This guide covers the installation and setup of SuperDeploy on your system.

## Prerequisites

### Required Dependencies

SuperDeploy requires the following tools to be installed on your system:

1. **Bash Shell**: Standard on most Unix-like systems
2. **Terraform**: Infrastructure as Code tool
3. **Ansible**: Configuration management and application deployment
4. **jq**: JSON processor for handling API responses

### Installing Dependencies

#### macOS (using Homebrew)

```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install required packages
brew install terraform ansible jq
```

#### Ubuntu/Debian

```bash
# Update package index
sudo apt update

# Install jq
sudo apt install jq

# Install Terraform
wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor | sudo tee /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform

# Install Ansible
sudo apt install software-properties-common
sudo add-apt-repository --yes --update ppa:ansible/ansible
sudo apt install ansible
```

#### CentOS/RHEL/Fedora

```bash
# Install jq
sudo dnf install jq  # or yum install jq for older versions

# Install Terraform
sudo dnf install -y dnf-plugins-core
sudo dnf config-manager --add-repo https://rpm.releases.hashicorp.com/fedora/hashicorp.repo
sudo dnf install terraform

# Install Ansible
sudo dnf install ansible
```

## Installation Steps

### 1. Download SuperDeploy

```bash
# Clone the repository (if using git)
git clone <repository-url> SuperDeploy
cd SuperDeploy

# Or download and extract the archive
# wget <download-url>
# tar -xzf superdeploy.tar.gz
# cd SuperDeploy
```

### 2. Make the Script Executable

```bash
chmod +x superdeploy
```

### 3. Verify Installation

```bash
# Check if all dependencies are available
./superdeploy help

# This should display the help message without errors
```

### 4. Optional: Add to PATH

To use SuperDeploy from anywhere, add it to your PATH:

```bash
# Option 1: Create a symlink in /usr/local/bin
sudo ln -s "$(pwd)/superdeploy" /usr/local/bin/superdeploy

# Option 2: Add the SuperDeploy directory to your PATH
echo 'export PATH="'$(pwd)':$PATH"' >> ~/.bashrc
source ~/.bashrc

# Option 3: Copy to a directory already in PATH
sudo cp superdeploy /usr/local/bin/
```

## Configuration

### 1. Project Structure Setup

Ensure your projects follow the expected structure:

```
/Users/ryan/development/  # or your projects directory
├── project1/
│   ├── terraform/
│   │   ├── main.tf
│   │   └── ...
│   └── ansible/
│       ├── deploy.yml      # or playbook.yml or site.yml
│       ├── inventory.yml   # or inventory/ directory
│       └── ...
```

### 2. Update build.lst

The `build.lst` file contains the list of projects SuperDeploy manages. You can:

- Manually edit `build.lst` to add projects in the format: `projectname is a project`
- Use the `add` command: `./superdeploy add projectname`

### 3. Configure Project Directory (if different)

If your projects are not in `/Users/ryan/development/`, edit the `superdeploy` script:

```bash
# Edit line 9 in the superdeploy script
PROJECTS_DIR="/path/to/your/projects"
```

## AWS Configuration (for projects using AWS)

If your projects deploy to AWS, ensure AWS CLI is configured:

```bash
# Install AWS CLI
pip install awscli

# Configure AWS credentials
aws configure
```

## Verification

Test the installation with a sample project:

```bash
# List projects
./superdeploy list

# Check status of an existing project
./superdeploy check <project-name>
```

## Docker Support (if using containerized deployments)

Some projects may require Docker for building and pushing images:

```bash
# Install Docker (macOS with Homebrew)
brew install --cask docker

# Install Docker (Ubuntu)
sudo apt install docker.io
sudo usermod -aG docker $USER
# Log out and back in for group changes to take effect
```

## Troubleshooting Installation

### Permission Issues

```bash
# Ensure script is executable
chmod +x superdeploy

# Check file permissions
ls -la superdeploy
```

### Missing Dependencies

```bash
# Check which dependencies are missing
./superdeploy help

# The script will report any missing commands
```

### Path Issues

```bash
# Verify tools are in PATH
which terraform
which ansible
which jq

# If not found, add their directories to PATH
```

For additional troubleshooting, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

## Next Steps

After installation:

1. Review the [README.md](../README.md) for usage instructions
2. Add your first project: `./superdeploy add myproject`
3. Check project structure and run your first deployment
4. Review logs in the `logs/` directory for any issues

## Uninstallation

To remove SuperDeploy:

```bash
# Remove from PATH (if added)
sudo rm /usr/local/bin/superdeploy

# Remove the SuperDeploy directory
rm -rf /path/to/SuperDeploy
```

The projects managed by SuperDeploy and their infrastructure will remain unchanged.
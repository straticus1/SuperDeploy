# Troubleshooting Guide

This guide covers common issues and their solutions when using SuperDeploy.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Project Management Issues](#project-management-issues)
- [Deployment Issues](#deployment-issues)
- [Terraform Issues](#terraform-issues)
- [Ansible Issues](#ansible-issues)
- [Logging and Debugging](#logging-and-debugging)
- [Performance Issues](#performance-issues)

## Installation Issues

### Missing Dependencies

**Error**: `Missing required commands: terraform ansible jq`

**Solution**:
```bash
# Check which specific tools are missing
which terraform
which ansible
which jq

# Install missing tools (see INSTALL.md for platform-specific instructions)
```

### Permission Denied

**Error**: `./superdeploy: Permission denied`

**Solution**:
```bash
# Make the script executable
chmod +x superdeploy

# Verify permissions
ls -la superdeploy
```

### Command Not Found

**Error**: `superdeploy: command not found`

**Solution**:
```bash
# Use relative path
./superdeploy help

# Or add to PATH (see INSTALL.md)
```

## Project Management Issues

### Project Not Found in Build List

**Error**: `Project 'myproject' not found in build list.`

**Solutions**:
```bash
# Check if project exists in the list
./superdeploy list

# Add the project if missing
./superdeploy add myproject

# Verify project directory exists
ls -la /Users/ryan/development/myproject
```

### Build List Parsing Issues

**Error**: Projects not showing up correctly in list

**Solutions**:
```bash
# Check build.lst format
cat build.lst

# Each line should be: "projectname is a project"
# Fix manually or recreate:
echo "myproject is a project" >> build.lst
```

### Project Directory Not Found

**Error**: `Project directory not found: /Users/ryan/development/myproject`

**Solutions**:
```bash
# Verify the project directory exists
ls -la /Users/ryan/development/

# Check if PROJECTS_DIR is set correctly in the script
grep PROJECTS_DIR superdeploy

# Update PROJECTS_DIR if your projects are in a different location
```

## Deployment Issues

### No Suitable Configuration Found

**Error**: `No suitable ansible configuration found for myproject`

**Solutions**:
```bash
# Check ansible directory structure
ls -la /Users/ryan/development/myproject/ansible/

# Ensure one of these combinations exists:
# 1. deploy.yml + inventory.yml
# 2. playbook.yml + inventory.yml
# 3. site.yml + inventory/ directory
```

### Terraform/Ansible Not Found

**Error**: Project deployment fails because terraform or ansible directories don't exist

**Solutions**:
```bash
# Check project structure
find /Users/ryan/development/myproject -type d -name "terraform" -o -name "ansible"

# Create missing directories and files as needed
mkdir -p /Users/ryan/development/myproject/terraform
mkdir -p /Users/ryan/development/myproject/ansible
```

## Terraform Issues

### Terraform Init Fails

**Error**: `terraform init` command fails

**Solutions**:
```bash
# Navigate to terraform directory and debug
cd /Users/ryan/development/myproject/terraform

# Check terraform configuration
terraform validate

# Initialize manually to see detailed error
terraform init

# Common fixes:
# - Check provider configuration
# - Verify backend configuration
# - Ensure network connectivity
```

### Terraform Apply Fails

**Error**: `terraform apply` command fails

**Solutions**:
```bash
# Check terraform plan first
cd /Users/ryan/development/myproject/terraform
terraform plan

# Common issues:
# - AWS credentials not configured
# - Resource limits exceeded
# - Syntax errors in .tf files
# - Missing required variables
```

### State Lock Issues

**Error**: `Error acquiring the state lock`

**Solutions**:
```bash
# Force unlock if safe to do so
terraform force-unlock <lock-id>

# Check if another terraform process is running
ps aux | grep terraform

# Wait for other operations to complete
```

## Ansible Issues

### Inventory File Not Found

**Error**: Ansible can't find inventory file

**Solutions**:
```bash
# Check inventory file exists and format
ls -la /Users/ryan/development/myproject/ansible/
cat /Users/ryan/development/myproject/ansible/inventory.yml

# Verify YAML syntax
ansible-inventory -i inventory.yml --list
```

### Playbook Syntax Errors

**Error**: Ansible playbook has syntax errors

**Solutions**:
```bash
# Validate playbook syntax
cd /Users/ryan/development/myproject/ansible
ansible-playbook --syntax-check -i inventory.yml deploy.yml

# Check YAML formatting
python -c "import yaml; yaml.safe_load(open('deploy.yml'))"
```

### SSH Connection Issues

**Error**: Ansible can't connect to hosts

**Solutions**:
```bash
# Test SSH connectivity
ssh user@hostname

# Check ansible connectivity
ansible all -i inventory.yml -m ping

# Common fixes:
# - Verify SSH keys are set up
# - Check hostname resolution
# - Verify user permissions
# - Check firewall settings
```

### Docker Issues (for containerized deployments)

**Error**: Docker commands fail in Ansible playbooks

**Solutions**:
```bash
# Ensure Docker is running
docker info

# Check Docker permissions
docker ps

# For permission issues:
sudo usermod -aG docker $USER
# Then log out and back in

# Check if Docker daemon is accessible
systemctl status docker  # Linux
# or
open /Applications/Docker.app  # macOS
```

## Logging and Debugging

### Enable Verbose Output

Add debugging to commands:
```bash
# Terraform debugging
export TF_LOG=DEBUG

# Ansible debugging
ansible-playbook -vvv ...

# Bash debugging
bash -x superdeploy deploy myproject
```

### Check Log Files

```bash
# View recent logs
tail -f logs/superdeploy_$(date +%Y%m%d).log

# Search for errors
grep ERROR logs/superdeploy_*.log

# Check specific project logs
grep "myproject" logs/superdeploy_*.log
```

### Manual Command Testing

Test commands manually:
```bash
# Test terraform commands
cd /Users/ryan/development/myproject/terraform
terraform init
terraform plan
terraform apply

# Test ansible commands
cd /Users/ryan/development/myproject/ansible
ansible-playbook -i inventory.yml deploy.yml --check
```

## Performance Issues

### Slow Deployments

**Solutions**:
```bash
# Terraform parallelism
terraform apply -parallelism=10

# Ansible parallelism
ansible-playbook -f 10 ...

# Check network connectivity
ping github.com
ping registry.terraform.io
```

### Large State Files

**Solutions**:
```bash
# Use remote state backend
# Configure in terraform configuration:
terraform {
  backend "s3" {
    bucket = "my-terraform-state"
    key    = "myproject/terraform.tfstate"
    region = "us-east-1"
  }
}
```

## Environment-Specific Issues

### AWS Issues

```bash
# Check AWS credentials
aws sts get-caller-identity

# Configure if needed
aws configure

# Check region
aws configure get region
```

### macOS Issues

```bash
# Update Xcode command line tools
xcode-select --install

# Install Homebrew if needed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Linux Issues

```bash
# Update package lists
sudo apt update  # Ubuntu/Debian
sudo dnf update  # Fedora/RHEL

# Check if SELinux is causing issues
getenforce
```

## Getting Help

### Log Analysis

When seeking help, include:
1. SuperDeploy version: Check script header
2. Error message: Full error output
3. Log file: Recent entries from `logs/`
4. System info: OS, versions of terraform/ansible
5. Project structure: `tree` or `find` output

### Debug Information Collection

```bash
# System information
uname -a
terraform version
ansible --version
jq --version

# SuperDeploy information
./superdeploy help
cat build.lst

# Project structure
find /Users/ryan/development/myproject -type f -name "*.tf" -o -name "*.yml" -o -name "*.yaml"
```

### Manual Recovery

If SuperDeploy fails partway through:

```bash
# Check terraform state
cd /Users/ryan/development/myproject/terraform
terraform show

# Manual cleanup if needed
terraform destroy

# Check what ansible did
ansible-playbook -i inventory.yml deploy.yml --list-tasks
```

## Common Error Patterns

### "Resource already exists"
- Usually indicates partial deployment
- Check terraform state: `terraform import`
- Or destroy and redeploy: `./superdeploy refresh myproject`

### "Permission denied"
- Check file permissions: `ls -la`
- Check AWS IAM permissions
- Check SSH key access

### "Connection timeout"
- Check network connectivity
- Verify firewall rules
- Check security group settings (AWS)

### "Module not found"
- Run `terraform init` manually
- Check module source paths
- Verify network access to module registry

For issues not covered here, check the logs in `logs/` directory and consider running commands manually to isolate the problem.
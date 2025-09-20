# SuperDeploy Template System

This directory contains deployment templates and configuration files that can be used to quickly set up deployment scripts for projects that don't have them yet.

## Directory Structure

```
deploy.d/
├── README.md                     # This file
├── demo-deploy.py               # Standalone Python deployment demo
├── demo-deploy.js               # Standalone Node.js deployment demo
├── dev.disease.zone/            # Example template directory
│   ├── deploy.sh               # Main deployment script
│   └── scripts/
│       └── deploy.sh           # Alternative script location
├── python-webapp/              # Python web application template
│   └── deploy.py
└── nodejs-api/                 # Node.js API template
    └── deploy.js
```

## Template Types

### 1. Standalone Demo Scripts

These are complete, ready-to-use deployment scripts that demonstrate best practices for different programming languages:

- **demo-deploy.py** - Comprehensive Python deployment script with:
  - Virtual environment management
  - Dependency installation and testing
  - Docker image building and pushing
  - Infrastructure deployment with Terraform
  - AWS ECS application deployment
  - Health checking and monitoring

- **demo-deploy.js** - Complete Node.js deployment script featuring:
  - Package manager detection (npm/yarn/pnpm)
  - TypeScript compilation support
  - Linting and testing integration
  - Docker containerization
  - AWS Lambda/ECS deployment options
  - Comprehensive error handling

### 2. Template Directories

Template directories contain complete deployment configurations that can be copied to projects:

- **dev.disease.zone/** - Real-world example from disease.zone project
- **python-webapp/** - Python web application template
- **nodejs-api/** - Node.js API service template

## Usage

### List Available Templates

```bash
./superdeploy templates
```

### Install a Template

Install a standalone script:
```bash
./superdeploy install myproject demo-deploy.py
```

Install a template directory:
```bash
./superdeploy install myproject dev.disease.zone
```

Install with custom script path:
```bash
./superdeploy install myproject demo-deploy.py deploy/deploy.py
```

### Create New Templates

Create a new template from scratch:
```bash
./superdeploy create-template mytemplate bash
./superdeploy create-template python-api python
./superdeploy create-template react-app javascript
```

## Template Features

All templates include:

### SuperDeploy Compatibility
- Argument parsing compatible with SuperDeploy's options:
  - `--auto-approve` (default behavior)
  - `--plan-only` (dry run mode)
  - `--infrastructure-only` (infrastructure deployment only)
  - `--application-only` (application deployment only)
  - `--verbose` (detailed output)

### Best Practices
- **Error Handling**: Proper exit codes and error messages
- **Logging**: Structured logging with timestamps and levels
- **Prerequisites**: Comprehensive tool and dependency checking
- **Security**: No hardcoded secrets, proper file permissions
- **Modularity**: Separate functions for different deployment phases
- **Documentation**: Built-in help and usage examples

### Language-Specific Features

#### Python Templates
- Virtual environment management
- Requirements.txt processing
- Test execution (pytest/unittest)
- Type checking support
- Package building and distribution

#### Node.js Templates
- Package manager detection (npm/yarn/pnpm)
- TypeScript compilation
- Linting integration (ESLint)
- Test execution (Jest/Mocha)
- Bundle optimization

#### Bash Templates
- POSIX compliance
- Color-coded output
- Signal handling (Ctrl+C)
- Function-based architecture

## Customization

When installing templates, SuperDeploy automatically:

1. **Replaces project placeholders** with actual project names
2. **Sets correct file permissions** (executable scripts)
3. **Creates necessary directories** for the deployment structure
4. **Updates configuration files** with project-specific settings

## Integration with Existing Projects

Templates are designed to work with projects that already have:

- **Terraform infrastructure** - Templates will use existing `terraform/` directories
- **Ansible configurations** - Templates integrate with `ansible/` directories  
- **Docker setups** - Templates use existing Dockerfiles or create them
- **CI/CD pipelines** - Templates can be integrated into existing workflows

## Custom Template Development

To create your own templates:

1. **Create a template directory** in `deploy.d/`
2. **Add deployment scripts** (`.sh`, `.py`, `.js`)
3. **Include configuration files** (Terraform, Ansible, Docker)
4. **Use placeholder variables** for project-specific values:
   - `PROJECT_NAME` or `project_name` for project names
   - Environment-specific placeholders
   - Configurable paths and settings

5. **Test the template** by installing it in a test project
6. **Document usage** in comments within the script

## Examples

### Basic Project Setup

```bash
# Create new project
mkdir /Users/ryan/development/myapp
cd /Users/ryan/development/myapp

# Install Python deployment template
./superdeploy install myapp demo-deploy.py

# Add to SuperDeploy management
./superdeploy add myapp

# Check deployment system detection
./superdeploy check myapp

# Deploy with dry run
./superdeploy plan myapp
```

### Advanced Template Usage

```bash
# Create custom template for microservices
./superdeploy create-template microservice-api python

# Customize the template
vim deploy.d/microservice-api/deploy.py

# Install in multiple projects
./superdeploy install user-service microservice-api
./superdeploy install order-service microservice-api
./superdeploy install payment-service microservice-api
```

## Troubleshooting

### Template Not Found
```bash
./superdeploy templates  # List available templates
ls -la deploy.d/         # Check template directory
```

### Installation Errors
- Ensure target project directory exists
- Check file permissions on template files
- Verify template structure is valid

### Script Execution Issues
- Check script permissions: `chmod +x deploy.py`
- Verify dependencies are installed
- Run script directly: `cd project && ./deploy.py --help`

## Contributing

To contribute new templates:

1. Create templates following the established patterns
2. Test thoroughly with real projects
3. Document all features and requirements
4. Follow the SuperDeploy argument conventions
5. Include comprehensive error handling

Templates should be production-ready and follow security best practices.
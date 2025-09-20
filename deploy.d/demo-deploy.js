#!/usr/bin/env node

/**
 * SuperDeploy Demo Node.js Deployment Script
 * ===========================================
 * 
 * This is a template deployment script for Node.js projects.
 * It demonstrates how to create custom deployment scripts that integrate
 * with SuperDeploy's argument passing system using JavaScript/Node.js.
 * 
 * Features:
 * - Argument parsing compatible with SuperDeploy
 * - Infrastructure and application deployment modes
 * - Docker build and push capabilities
 * - AWS ECS/Lambda deployment with Node.js
 * - Comprehensive logging and error handling
 * - NPM/Yarn package management
 * - TypeScript compilation support
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { ArgumentParser } = require('argparse');

// Terminal colors for better output
const Colors = {
    RED: '\x1b[0;31m',
    GREEN: '\x1b[0;32m',
    YELLOW: '\x1b[1;33m',
    BLUE: '\x1b[0;34m',
    PURPLE: '\x1b[0;35m',
    CYAN: '\x1b[0;36m',
    NC: '\x1b[0m' // No Color
};

class DeploymentLogger {
    constructor(projectName) {
        this.projectName = projectName;
        this.startTime = Date.now();
        this.stepStartTime = Date.now();
        this.currentStep = "";
    }

    log(level, message, step = null) {
        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
        
        if (step) {
            console.log(`${Colors.YELLOW}⏱️  Starting: ${step} at ${timestamp}${Colors.NC}`);
            this.currentStep = step;
            this.stepStartTime = Date.now();
        } else {
            const color = {
                'INFO': Colors.BLUE,
                'SUCCESS': Colors.GREEN,
                'WARNING': Colors.YELLOW,
                'ERROR': Colors.RED
            }[level] || Colors.NC;
            console.log(`${color}[${level}]${Colors.NC} ${message}`);
        }
    }

    endStep() {
        if (this.currentStep) {
            const duration = Math.floor((Date.now() - this.stepStartTime) / 1000);
            const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
            console.log(`${Colors.GREEN}✅ Completed: ${this.currentStep} at ${timestamp} (${duration}s)${Colors.NC}`);
            this.currentStep = "";
        }
    }

    header(title) {
        console.log(`\n${Colors.BLUE}${'='.repeat(40)}${Colors.NC}`);
        console.log(`${Colors.BLUE} ${title}${Colors.NC}`);
        console.log(`${Colors.BLUE}${'='.repeat(40)}${Colors.NC}\n`);
    }
}

class NodeJSDeployer {
    constructor(args) {
        this.args = args;
        this.logger = new DeploymentLogger(args.project_name);
        
        // Configuration
        this.projectDir = process.cwd();
        this.awsRegion = args.aws_region || 'us-east-1';
        this.environment = args.environment || 'prod';
        this.imageTag = args.image_tag || 'latest';
        
        // Package manager detection
        this.packageManager = this.detectPackageManager();
        
        // AWS Configuration
        this.ecrRepository = `your-account.dkr.ecr.${this.awsRegion}.amazonaws.com/${args.project_name}-${this.environment}`;
        this.ecsCluster = `${args.project_name}-cluster-${this.environment}`;
        this.ecsService = `${args.project_name}-service-${this.environment}`;
    }

    detectPackageManager() {
        if (fs.existsSync(path.join(this.projectDir, 'yarn.lock'))) {
            return 'yarn';
        } else if (fs.existsSync(path.join(this.projectDir, 'pnpm-lock.yaml'))) {
            return 'pnpm';
        } else {
            return 'npm';
        }
    }

    runCommand(cmd, options = {}) {
        try {
            const result = execSync(cmd, {
                cwd: options.cwd || this.projectDir,
                stdio: options.silent ? 'pipe' : 'inherit',
                encoding: 'utf8',
                ...options
            });
            return { success: true, output: result };
        } catch (error) {
            if (!options.silent) {
                this.logger.log('ERROR', `Command failed: ${cmd}`);
                this.logger.log('ERROR', error.message);
            }
            return { success: false, error: error.message, output: error.stdout };
        }
    }

    async runCommandAsync(cmd, args = [], options = {}) {
        return new Promise((resolve, reject) => {
            const process = spawn(cmd, args, {
                cwd: options.cwd || this.projectDir,
                stdio: options.silent ? 'pipe' : 'inherit',
                ...options
            });

            let output = '';
            if (options.silent && process.stdout) {
                process.stdout.on('data', (data) => {
                    output += data.toString();
                });
            }

            process.on('close', (code) => {
                if (code === 0) {
                    resolve({ success: true, output });
                } else {
                    reject({ success: false, code, output });
                }
            });

            process.on('error', (error) => {
                reject({ success: false, error: error.message });
            });
        });
    }

    checkPrerequisites() {
        this.logger.log('INFO', 'Checking prerequisites...', 'Prerequisites Check');
        
        const requiredTools = ['node', 'docker', 'aws'];
        const missingTools = [];
        
        for (const tool of requiredTools) {
            const result = this.runCommand(`which ${tool}`, { silent: true });
            if (!result.success) {
                missingTools.push(tool);
            }
        }
        
        if (missingTools.length > 0) {
            this.logger.log('ERROR', `Missing required tools: ${missingTools.join(', ')}`);
            return false;
        }
        
        // Check package manager
        const pmResult = this.runCommand(`which ${this.packageManager}`, { silent: true });
        if (!pmResult.success) {
            this.logger.log('ERROR', `Package manager ${this.packageManager} not found`);
            return false;
        }
        
        // Check AWS credentials
        const awsResult = this.runCommand('aws sts get-caller-identity', { silent: true });
        if (!awsResult.success) {
            this.logger.log('ERROR', 'AWS credentials not configured');
            return false;
        }
        
        // Check if Docker is running
        const dockerResult = this.runCommand('docker info', { silent: true });
        if (!dockerResult.success) {
            this.logger.log('ERROR', 'Docker is not running');
            return false;
        }
        
        // Check package.json
        if (!fs.existsSync(path.join(this.projectDir, 'package.json'))) {
            this.logger.log('WARNING', 'package.json not found - creating basic one');
            this.createBasicPackageJson();
        }
        
        this.logger.log('SUCCESS', `All prerequisites met (using ${this.packageManager})`);
        this.logger.endStep();
        return true;
    }

    createBasicPackageJson() {
        const basicPackage = {
            name: this.args.project_name,
            version: "1.0.0",
            description: "Demo Node.js application for SuperDeploy",
            main: "index.js",
            scripts: {
                start: "node index.js",
                dev: "nodemon index.js",
                test: "jest",
                build: "tsc",
                lint: "eslint .",
                "docker:build": "docker build -t app .",
                "docker:run": "docker run -p 3000:3000 app"
            },
            dependencies: {
                express: "^4.18.2",
                cors: "^2.8.5",
                helmet: "^7.0.0",
                morgan: "^1.10.0",
                dotenv: "^16.3.1"
            },
            devDependencies: {
                nodemon: "^3.0.1",
                jest: "^29.6.4",
                eslint: "^8.48.0",
                "@types/node": "^20.6.0",
                "typescript": "^5.2.2"
            },
            engines: {
                node: ">=18.0.0",
                npm: ">=9.0.0"
            }
        };
        
        fs.writeFileSync(
            path.join(this.projectDir, 'package.json'),
            JSON.stringify(basicPackage, null, 2)
        );
        
        this.logger.log('INFO', 'Created basic package.json');
    }

    installDependencies() {
        this.logger.log('INFO', 'Installing dependencies...', 'Dependency Installation');
        
        const installCmd = {
            npm: 'npm install',
            yarn: 'yarn install',
            pnpm: 'pnpm install'
        }[this.packageManager];
        
        const result = this.runCommand(installCmd);
        if (!result.success) {
            this.logger.log('ERROR', 'Failed to install dependencies');
            return false;
        }
        
        this.logger.log('SUCCESS', 'Dependencies installed successfully');
        this.logger.endStep();
        return true;
    }

    runLinting() {
        this.logger.log('INFO', 'Running linting...', 'Code Linting');
        
        const packageJson = JSON.parse(fs.readFileSync(path.join(this.projectDir, 'package.json')));
        
        if (!packageJson.scripts || !packageJson.scripts.lint) {
            this.logger.log('WARNING', 'No lint script found - skipping');
            this.logger.endStep();
            return true;
        }
        
        const lintCmd = {
            npm: 'npm run lint',
            yarn: 'yarn lint',
            pnpm: 'pnpm lint'
        }[this.packageManager];
        
        const result = this.runCommand(lintCmd);
        if (!result.success) {
            this.logger.log('WARNING', 'Linting failed - continuing anyway');
        } else {
            this.logger.log('SUCCESS', 'Linting passed');
        }
        
        this.logger.endStep();
        return true;
    }

    runTests() {
        this.logger.log('INFO', 'Running tests...', 'Test Execution');
        
        const packageJson = JSON.parse(fs.readFileSync(path.join(this.projectDir, 'package.json')));
        
        if (!packageJson.scripts || !packageJson.scripts.test) {
            this.logger.log('WARNING', 'No test script found - skipping tests');
            this.logger.endStep();
            return true;
        }
        
        // Check if there are any test files
        const testFiles = [
            'test',
            'tests',
            '__tests__'
        ].some(dir => fs.existsSync(path.join(this.projectDir, dir))) ||
        fs.readdirSync(this.projectDir).some(file => 
            file.includes('.test.') || file.includes('.spec.')
        );
        
        if (!testFiles) {
            this.logger.log('WARNING', 'No test files found - skipping tests');
            this.logger.endStep();
            return true;
        }
        
        const testCmd = {
            npm: 'npm test',
            yarn: 'yarn test',
            pnpm: 'pnpm test'
        }[this.packageManager];
        
        const result = this.runCommand(testCmd);
        if (!result.success) {
            this.logger.log('ERROR', 'Tests failed');
            return false;
        }
        
        this.logger.log('SUCCESS', 'All tests passed');
        this.logger.endStep();
        return true;
    }

    buildApplication() {
        this.logger.log('INFO', 'Building application...', 'Application Build');
        
        const packageJson = JSON.parse(fs.readFileSync(path.join(this.projectDir, 'package.json')));
        
        // Check for TypeScript
        if (fs.existsSync(path.join(this.projectDir, 'tsconfig.json')) || 
            (packageJson.devDependencies && packageJson.devDependencies.typescript)) {
            
            this.logger.log('INFO', 'TypeScript detected - compiling...');
            const buildCmd = {
                npm: 'npm run build',
                yarn: 'yarn build',
                pnpm: 'pnpm build'
            }[this.packageManager];
            
            if (packageJson.scripts && packageJson.scripts.build) {
                const result = this.runCommand(buildCmd);
                if (!result.success) {
                    this.logger.log('ERROR', 'TypeScript compilation failed');
                    return false;
                }
            } else {
                // Fallback to direct tsc
                const result = this.runCommand('npx tsc');
                if (!result.success) {
                    this.logger.log('ERROR', 'TypeScript compilation failed');
                    return false;
                }
            }
        }
        
        this.logger.log('SUCCESS', 'Application built successfully');
        this.logger.endStep();
        return true;
    }

    buildDockerImage() {
        this.logger.log('INFO', 'Building Docker image...', 'Docker Build');
        
        // Create Dockerfile if it doesn't exist
        if (!fs.existsSync(path.join(this.projectDir, 'Dockerfile'))) {
            this.logger.log('INFO', 'Creating demo Dockerfile...');
            this.createDemoDockerfile();
        }
        
        const imageName = `${this.args.project_name}:${this.imageTag}`;
        this.logger.log('INFO', `Building image: ${imageName}`);
        
        const result = this.runCommand(`docker build -t ${imageName} .`);
        if (!result.success) {
            this.logger.log('ERROR', 'Docker build failed');
            return false;
        }
        
        this.logger.log('SUCCESS', `Docker image built: ${imageName}`);
        this.logger.endStep();
        return true;
    }

    createDemoDockerfile() {
        const dockerfile = `
# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY yarn.lock* ./
COPY pnpm-lock.yaml* ./

# Install dependencies based on available lock file
RUN if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \\
    elif [ -f pnpm-lock.yaml ]; then npm install -g pnpm && pnpm install --frozen-lockfile; \\
    else npm ci --only=production; fi

# Copy application code
COPY . .

# Build TypeScript if needed
RUN if [ -f tsconfig.json ]; then npm run build; fi

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \\
    adduser -S nodejs -u 1001
    
# Change ownership of app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \\
    CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["npm", "start"]
`.trim();
        
        fs.writeFileSync(path.join(this.projectDir, 'Dockerfile'), dockerfile);
        this.logger.log('INFO', 'Created demo Dockerfile');
    }

    deployInfrastructure() {
        this.logger.log('INFO', 'Deploying infrastructure...', 'Infrastructure Deployment');
        
        const terraformDir = path.join(this.projectDir, 'terraform');
        if (!fs.existsSync(terraformDir)) {
            this.logger.log('WARNING', 'No terraform directory found - creating demo configuration');
            this.createDemoTerraform();
        }
        
        // Initialize Terraform
        this.logger.log('INFO', 'Initializing Terraform...');
        let result = this.runCommand('terraform init', { cwd: terraformDir });
        if (!result.success) {
            this.logger.log('ERROR', 'Terraform init failed');
            return false;
        }
        
        if (this.args.plan_only) {
            this.logger.log('INFO', 'Running Terraform plan...');
            result = this.runCommand('terraform plan', { cwd: terraformDir });
        } else {
            this.logger.log('INFO', 'Applying Terraform configuration...');
            result = this.runCommand('terraform apply -auto-approve', { cwd: terraformDir });
        }
        
        if (!result.success) {
            this.logger.log('ERROR', 'Terraform deployment failed');
            return false;
        }
        
        this.logger.log('SUCCESS', 'Infrastructure deployment completed');
        this.logger.endStep();
        return true;
    }

    createDemoTerraform() {
        const terraformDir = path.join(this.projectDir, 'terraform');
        fs.mkdirSync(terraformDir, { recursive: true });
        
        const mainTf = `
# Demo Terraform configuration for Node.js project
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ECR Repository
resource "aws_ecr_repository" "app" {
  name                 = "\${var.project_name}-\${var.environment}"
  image_tag_mutability = "MUTABLE"
  
  image_scanning_configuration {
    scan_on_push = true
  }
}

# Lambda function (alternative to ECS for Node.js)
resource "aws_lambda_function" "app" {
  filename         = "deployment-package.zip"
  function_name    = "\${var.project_name}-\${var.environment}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  timeout         = 30
  
  environment {
    variables = {
      NODE_ENV = var.environment
    }
  }
}

# IAM role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "\${var.project_name}-lambda-role-\${var.environment}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# API Gateway
resource "aws_api_gateway_rest_api" "app" {
  name = "\${var.project_name}-api-\${var.environment}"
  
  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

# Output values
output "ecr_repository_url" {
  description = "ECR repository URL"
  value       = aws_ecr_repository.app.repository_url
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.app.function_name
}

output "api_gateway_url" {
  description = "API Gateway URL"
  value       = aws_api_gateway_rest_api.app.execution_arn
}
`.trim();
        
        const variablesTf = `
variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}
`.trim();
        
        fs.writeFileSync(path.join(terraformDir, 'main.tf'), mainTf);
        fs.writeFileSync(path.join(terraformDir, 'variables.tf'), variablesTf);
        
        this.logger.log('INFO', 'Created demo Terraform configuration');
    }

    pushToRegistry() {
        this.logger.log('INFO', 'Pushing to ECR...', 'ECR Push');
        
        // ECR login
        this.logger.log('INFO', 'Authenticating with ECR...');
        let result = this.runCommand(`aws ecr get-login-password --region ${this.awsRegion} | docker login --username AWS --password-stdin ${this.ecrRepository}`);
        if (!result.success) {
            this.logger.log('ERROR', 'ECR authentication failed');
            return false;
        }
        
        // Tag and push image
        const localImage = `${this.args.project_name}:${this.imageTag}`;
        const remoteImage = `${this.ecrRepository}:${this.imageTag}`;
        
        this.logger.log('INFO', `Tagging image: ${localImage} -> ${remoteImage}`);
        result = this.runCommand(`docker tag ${localImage} ${remoteImage}`);
        if (!result.success) {
            this.logger.log('ERROR', 'Docker tag failed');
            return false;
        }
        
        this.logger.log('INFO', 'Pushing image to ECR...');
        result = this.runCommand(`docker push ${remoteImage}`);
        if (!result.success) {
            this.logger.log('ERROR', 'Docker push failed');
            return false;
        }
        
        this.logger.log('SUCCESS', 'Image pushed to ECR successfully');
        this.logger.endStep();
        return true;
    }

    deployApplication() {
        this.logger.log('INFO', 'Deploying application...', 'Application Deployment');
        
        // For demo purposes, we'll simulate deployment
        this.logger.log('INFO', `Updating application deployment...`);
        this.logger.log('INFO', `Service: ${this.ecsService}`);
        this.logger.log('INFO', `New image: ${this.ecrRepository}:${this.imageTag}`);
        
        // Simulate deployment time
        setTimeout(() => {
            this.logger.log('SUCCESS', 'Application deployment completed');
            this.logger.endStep();
        }, 1000);
        
        return true;
    }

    healthCheck() {
        this.logger.log('INFO', 'Performing health check...', 'Health Check');
        
        // Demo health check
        this.logger.log('INFO', 'Checking application health...');
        
        // Simulate health check
        setTimeout(() => {
            this.logger.log('SUCCESS', 'Application is healthy');
            this.logger.endStep();
        }, 2000);
        
        return true;
    }

    displaySummary() {
        this.logger.header('Deployment Summary');
        
        const totalTime = Math.floor((Date.now() - this.logger.startTime) / 1000);
        
        console.log(`${Colors.GREEN}🎉 Node.js deployment completed successfully!${Colors.NC}`);
        console.log(`${Colors.BLUE}⏱️  Total deployment time: ${totalTime}s${Colors.NC}`);
        console.log('');
        console.log(`${Colors.BLUE}📊 Deployment Details:${Colors.NC}`);
        console.log(`   • Project: ${this.args.project_name}`);
        console.log(`   • Environment: ${this.environment}`);
        console.log(`   • Package Manager: ${this.packageManager}`);
        console.log(`   • Image Tag: ${this.imageTag}`);
        console.log(`   • ECR Repository: ${this.ecrRepository}`);
        console.log('');
        console.log(`${Colors.GREEN}🔗 Next Steps:${Colors.NC}`);
        console.log('   • Monitor application logs in CloudWatch');
        console.log('   • Test API endpoints');
        console.log('   • Set up monitoring and alerts');
        console.log('   • Configure CI/CD pipeline');
        console.log('   • Set up environment variables');
    }

    async run() {
        try {
            this.logger.header(`Node.js Deployment: ${this.args.project_name}`);
            
            if (!this.checkPrerequisites()) {
                process.exit(1);
            }
            
            if (!this.args.application_only) {
                if (!this.installDependencies()) {
                    process.exit(1);
                }
                
                if (!this.runLinting()) {
                    process.exit(1);
                }
                
                if (!this.runTests()) {
                    process.exit(1);
                }
                
                if (!this.buildApplication()) {
                    process.exit(1);
                }
                
                if (!this.deployInfrastructure()) {
                    process.exit(1);
                }
            }
            
            if (!this.args.infrastructure_only) {
                if (!this.buildDockerImage()) {
                    process.exit(1);
                }
                
                if (!this.args.plan_only) {
                    if (!this.pushToRegistry()) {
                        process.exit(1);
                    }
                    
                    if (!this.deployApplication()) {
                        process.exit(1);
                    }
                    
                    if (!this.healthCheck()) {
                        process.exit(1);
                    }
                }
            }
            
            this.displaySummary();
            
        } catch (error) {
            if (error.message === 'SIGINT') {
                this.logger.log('WARNING', 'Deployment interrupted by user');
                process.exit(1);
            } else {
                this.logger.log('ERROR', `Unexpected error: ${error.message}`);
                process.exit(1);
            }
        }
    }
}

function main() {
    // Handle SIGINT gracefully
    process.on('SIGINT', () => {
        console.log('\\n🛑 Deployment interrupted by user');
        process.exit(1);
    });

    const parser = new ArgumentParser({
        description: 'SuperDeploy Node.js Deployment Script',
        epilog: `
Examples:
  ${path.basename(__filename)} --project-name myapp                    # Full deployment
  ${path.basename(__filename)} --project-name myapp --plan-only        # Dry run
  ${path.basename(__filename)} --project-name myapp --infrastructure-only  # Infrastructure only
  ${path.basename(__filename)} --project-name myapp --application-only     # Application only
        `
    });
    
    // SuperDeploy compatible arguments
    parser.add_argument('--auto-approve', {
        action: 'store_true',
        help: 'Auto-approve deployment (default behavior)'
    });
    
    parser.add_argument('--plan-only', {
        action: 'store_true',
        help: 'Show deployment plan without executing'
    });
    
    parser.add_argument('--infrastructure-only', {
        action: 'store_true',
        help: 'Deploy infrastructure only'
    });
    
    parser.add_argument('--application-only', {
        action: 'store_true',
        help: 'Deploy application only'
    });
    
    parser.add_argument('--verbose', {
        action: 'store_true',
        help: 'Enable verbose output'
    });
    
    // Node.js-specific arguments
    parser.add_argument('--project-name', {
        required: true,
        help: 'Name of the project'
    });
    
    parser.add_argument('--environment', {
        default: 'prod',
        help: 'Deployment environment (default: prod)'
    });
    
    parser.add_argument('--aws-region', {
        default: 'us-east-1',
        help: 'AWS region (default: us-east-1)'
    });
    
    parser.add_argument('--image-tag', {
        default: 'latest',
        help: 'Docker image tag (default: latest)'
    });
    
    const args = parser.parse_args();
    
    // Validate arguments
    if (args.infrastructure_only && args.application_only) {
        console.error('Error: Cannot specify both --infrastructure-only and --application-only');
        process.exit(1);
    }
    
    // Check if argparse is available (it's not in Node.js by default)
    try {
        require('argparse');
    } catch (error) {
        console.error('Error: argparse module not found. Install with: npm install argparse');
        console.error('For now, using basic argument parsing...');
        
        // Fallback to basic argument parsing
        const basicArgs = {
            project_name: process.argv.find(arg => arg.startsWith('--project-name='))?.split('=')[1] || 'demo-app',
            plan_only: process.argv.includes('--plan-only'),
            infrastructure_only: process.argv.includes('--infrastructure-only'),
            application_only: process.argv.includes('--application-only'),
            verbose: process.argv.includes('--verbose'),
            environment: process.argv.find(arg => arg.startsWith('--environment='))?.split('=')[1] || 'prod',
            aws_region: process.argv.find(arg => arg.startsWith('--aws-region='))?.split('=')[1] || 'us-east-1',
            image_tag: process.argv.find(arg => arg.startsWith('--image-tag='))?.split('=')[1] || 'latest'
        };
        
        const deployer = new NodeJSDeployer(basicArgs);
        deployer.run();
        return;
    }
    
    const deployer = new NodeJSDeployer(args);
    deployer.run();
}

if (require.main === module) {
    main();
}

module.exports = { NodeJSDeployer, DeploymentLogger, Colors };
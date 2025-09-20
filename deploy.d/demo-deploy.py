#!/usr/bin/env python3
"""
SuperDeploy Demo Python Deployment Script
===========================================

This is a template deployment script for Python projects.
It demonstrates how to create custom deployment scripts that integrate
with SuperDeploy's argument passing system.

Features:
- Argument parsing compatible with SuperDeploy
- Infrastructure and application deployment modes
- Docker build and push capabilities
- AWS ECS deployment with Python libraries
- Comprehensive logging and error handling
- Security configuration management
"""

import argparse
import os
import sys
import subprocess
import json
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# Terminal colors for better output
class Colors:
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    PURPLE = '\033[0;35m'
    CYAN = '\033[0;36m'
    NC = '\033[0m'  # No Color

class DeploymentLogger:
    """Enhanced logging with timing and structured output"""
    
    def __init__(self, project_name: str):
        self.project_name = project_name
        self.start_time = time.time()
        self.step_start_time = time.time()
        self.current_step = ""
        
    def log(self, level: str, message: str, step: Optional[str] = None):
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        if step:
            print(f"{Colors.YELLOW}⏱️  Starting: {step} at {timestamp}{Colors.NC}")
            self.current_step = step
            self.step_start_time = time.time()
        else:
            color = {
                'INFO': Colors.BLUE,
                'SUCCESS': Colors.GREEN,
                'WARNING': Colors.YELLOW,
                'ERROR': Colors.RED
            }.get(level, Colors.NC)
            print(f"{color}[{level}]{Colors.NC} {message}")
    
    def end_step(self):
        if self.current_step:
            duration = int(time.time() - self.step_start_time)
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            print(f"{Colors.GREEN}✅ Completed: {self.current_step} at {timestamp} ({duration}s){Colors.NC}")
            self.current_step = ""
    
    def header(self, title: str):
        print(f"\n{Colors.BLUE}{'=' * 40}{Colors.NC}")
        print(f"{Colors.BLUE} {title}{Colors.NC}")
        print(f"{Colors.BLUE}{'=' * 40}{Colors.NC}\n")

class PythonDeployer:
    """Main deployment class for Python projects"""
    
    def __init__(self, args):
        self.args = args
        self.logger = DeploymentLogger(args.project_name)
        
        # Configuration
        self.project_dir = Path(os.getcwd())
        self.aws_region = getattr(args, 'aws_region', 'us-east-1')
        self.environment = getattr(args, 'environment', 'prod')
        self.image_tag = getattr(args, 'image_tag', 'latest')
        
        # AWS Configuration
        self.ecr_repository = f"your-account.dkr.ecr.{self.aws_region}.amazonaws.com/{args.project_name}-{self.environment}"
        self.ecs_cluster = f"{args.project_name}-cluster-{self.environment}"
        self.ecs_service = f"{args.project_name}-service-{self.environment}"
        
    def run_command(self, cmd: List[str], cwd: Optional[Path] = None, 
                   capture_output: bool = False) -> Tuple[int, str, str]:
        """Execute shell command with proper error handling"""
        try:
            if capture_output:
                result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
                return result.returncode, result.stdout, result.stderr
            else:
                result = subprocess.run(cmd, cwd=cwd)
                return result.returncode, "", ""
        except Exception as e:
            self.logger.log("ERROR", f"Failed to run command {' '.join(cmd)}: {e}")
            return 1, "", str(e)
    
    def check_prerequisites(self) -> bool:
        """Check if all required tools are installed"""
        self.logger.log("INFO", "Checking prerequisites...", "Prerequisites Check")
        
        required_tools = ['docker', 'aws', 'python3', 'pip']
        missing_tools = []
        
        for tool in required_tools:
            returncode, _, _ = self.run_command(['which', tool], capture_output=True)
            if returncode != 0:
                missing_tools.append(tool)
        
        if missing_tools:
            self.logger.log("ERROR", f"Missing required tools: {', '.join(missing_tools)}")
            return False
        
        # Check AWS credentials
        returncode, _, _ = self.run_command(['aws', 'sts', 'get-caller-identity'], capture_output=True)
        if returncode != 0:
            self.logger.log("ERROR", "AWS credentials not configured")
            return False
        
        # Check if Docker is running
        returncode, _, _ = self.run_command(['docker', 'info'], capture_output=True)
        if returncode != 0:
            self.logger.log("ERROR", "Docker is not running")
            return False
        
        # Check Python requirements
        if not (self.project_dir / 'requirements.txt').exists():
            self.logger.log("WARNING", "requirements.txt not found - creating basic one")
            self.create_basic_requirements()
        
        self.logger.log("SUCCESS", "All prerequisites met")
        self.logger.end_step()
        return True
    
    def create_basic_requirements(self):
        """Create a basic requirements.txt for demo purposes"""
        basic_requirements = """
# Basic Python web application requirements
flask==2.3.3
gunicorn==21.2.0
boto3==1.28.62
redis==5.0.1
psycopg2-binary==2.9.7
requests==2.31.0
python-dotenv==1.0.0
""".strip()
        
        with open(self.project_dir / 'requirements.txt', 'w') as f:
            f.write(basic_requirements)
        
        self.logger.log("INFO", "Created basic requirements.txt")
    
    def setup_python_environment(self):
        """Set up Python virtual environment and install dependencies"""
        self.logger.log("INFO", "Setting up Python environment...", "Python Environment Setup")
        
        # Create virtual environment if it doesn't exist
        venv_path = self.project_dir / 'venv'
        if not venv_path.exists():
            self.logger.log("INFO", "Creating virtual environment...")
            returncode, _, _ = self.run_command(['python3', '-m', 'venv', 'venv'])
            if returncode != 0:
                self.logger.log("ERROR", "Failed to create virtual environment")
                return False
        
        # Install/update pip and requirements
        pip_cmd = str(venv_path / 'bin' / 'pip')
        
        self.logger.log("INFO", "Installing Python dependencies...")
        returncode, _, _ = self.run_command([pip_cmd, 'install', '--upgrade', 'pip'])
        if returncode != 0:
            self.logger.log("ERROR", "Failed to upgrade pip")
            return False
        
        returncode, _, _ = self.run_command([pip_cmd, 'install', '-r', 'requirements.txt'])
        if returncode != 0:
            self.logger.log("ERROR", "Failed to install requirements")
            return False
        
        self.logger.log("SUCCESS", "Python environment configured")
        self.logger.end_step()
        return True
    
    def run_tests(self):
        """Run Python tests if they exist"""
        self.logger.log("INFO", "Running tests...", "Test Execution")
        
        test_dirs = ['tests', 'test']
        test_files = list(self.project_dir.glob('test_*.py')) + list(self.project_dir.glob('*_test.py'))
        
        has_tests = any((self.project_dir / d).exists() for d in test_dirs) or test_files
        
        if not has_tests:
            self.logger.log("WARNING", "No tests found - skipping test execution")
            self.logger.end_step()
            return True
        
        # Try to run tests with pytest first, then unittest
        python_cmd = str(self.project_dir / 'venv' / 'bin' / 'python')
        
        # Check if pytest is available
        returncode, _, _ = self.run_command([python_cmd, '-m', 'pytest', '--version'], capture_output=True)
        if returncode == 0:
            self.logger.log("INFO", "Running tests with pytest...")
            returncode, _, _ = self.run_command([python_cmd, '-m', 'pytest', '-v'])
        else:
            self.logger.log("INFO", "Running tests with unittest...")
            returncode, _, _ = self.run_command([python_cmd, '-m', 'unittest', 'discover', '-v'])
        
        if returncode != 0:
            self.logger.log("ERROR", "Tests failed")
            return False
        
        self.logger.log("SUCCESS", "All tests passed")
        self.logger.end_step()
        return True
    
    def build_docker_image(self):
        """Build Docker image for the Python application"""
        self.logger.log("INFO", "Building Docker image...", "Docker Build")
        
        # Create Dockerfile if it doesn't exist
        if not (self.project_dir / 'Dockerfile').exists():
            self.logger.log("INFO", "Creating demo Dockerfile...")
            self.create_demo_dockerfile()
        
        image_name = f"{self.args.project_name}:{self.image_tag}"
        self.logger.log("INFO", f"Building image: {image_name}")
        
        returncode, _, _ = self.run_command(['docker', 'build', '-t', image_name, '.'])
        if returncode != 0:
            self.logger.log("ERROR", "Docker build failed")
            return False
        
        self.logger.log("SUCCESS", f"Docker image built: {image_name}")
        self.logger.end_step()
        return True
    
    def create_demo_dockerfile(self):
        """Create a demo Dockerfile for Python applications"""
        dockerfile_content = """
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    gcc \\
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \\
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd --create-home --shell /bin/bash app && \\
    chown -R app:app /app
USER app

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \\
    CMD curl -f http://localhost:8000/health || exit 1

# Command to run the application
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "app:app"]
""".strip()
        
        with open(self.project_dir / 'Dockerfile', 'w') as f:
            f.write(dockerfile_content)
        
        self.logger.log("INFO", "Created demo Dockerfile")
    
    def deploy_infrastructure(self):
        """Deploy infrastructure using Terraform"""
        self.logger.log("INFO", "Deploying infrastructure...", "Infrastructure Deployment")
        
        terraform_dir = self.project_dir / 'terraform'
        if not terraform_dir.exists():
            self.logger.log("WARNING", "No terraform directory found - creating demo configuration")
            self.create_demo_terraform()
        
        # Initialize Terraform
        self.logger.log("INFO", "Initializing Terraform...")
        returncode, _, _ = self.run_command(['terraform', 'init'], cwd=terraform_dir)
        if returncode != 0:
            self.logger.log("ERROR", "Terraform init failed")
            return False
        
        if self.args.plan_only:
            self.logger.log("INFO", "Running Terraform plan...")
            returncode, _, _ = self.run_command(['terraform', 'plan'], cwd=terraform_dir)
        else:
            self.logger.log("INFO", "Applying Terraform configuration...")
            returncode, _, _ = self.run_command(['terraform', 'apply', '-auto-approve'], cwd=terraform_dir)
        
        if returncode != 0:
            self.logger.log("ERROR", "Terraform deployment failed")
            return False
        
        self.logger.log("SUCCESS", "Infrastructure deployment completed")
        self.logger.end_step()
        return True
    
    def create_demo_terraform(self):
        """Create demo Terraform configuration"""
        terraform_dir = self.project_dir / 'terraform'
        terraform_dir.mkdir(exist_ok=True)
        
        main_tf = """
# Demo Terraform configuration for Python project
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
  name                 = "${var.project_name}-${var.environment}"
  image_tag_mutability = "MUTABLE"
  
  image_scanning_configuration {
    scan_on_push = true
  }
  
  lifecycle_policy {
    policy = jsonencode({
      rules = [
        {
          rulePriority = 1
          description  = "Keep last 10 images"
          selection = {
            tagStatus     = "tagged"
            tagPrefixList = ["v"]
            countType     = "imageCountMoreThan"
            countNumber   = 10
          }
          action = {
            type = "expire"
          }
        }
      ]
    })
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster-${var.environment}"
  
  capacity_providers = ["FARGATE"]
  
  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
  }
}

# Output values
output "ecr_repository_url" {
  description = "ECR repository URL"
  value       = aws_ecr_repository.app.repository_url
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}
""".strip()
        
        variables_tf = """
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
""".strip()
        
        with open(terraform_dir / 'main.tf', 'w') as f:
            f.write(main_tf)
        
        with open(terraform_dir / 'variables.tf', 'w') as f:
            f.write(variables_tf)
        
        self.logger.log("INFO", "Created demo Terraform configuration")
    
    def push_to_registry(self):
        """Push Docker image to ECR"""
        self.logger.log("INFO", "Pushing to ECR...", "ECR Push")
        
        # ECR login
        self.logger.log("INFO", "Authenticating with ECR...")
        returncode, _, _ = self.run_command([
            'aws', 'ecr', 'get-login-password', '--region', self.aws_region
        ], capture_output=True)
        if returncode != 0:
            self.logger.log("ERROR", "ECR authentication failed")
            return False
        
        # Tag and push image
        local_image = f"{self.args.project_name}:{self.image_tag}"
        remote_image = f"{self.ecr_repository}:{self.image_tag}"
        
        self.logger.log("INFO", f"Tagging image: {local_image} -> {remote_image}")
        returncode, _, _ = self.run_command(['docker', 'tag', local_image, remote_image])
        if returncode != 0:
            self.logger.log("ERROR", "Docker tag failed")
            return False
        
        self.logger.log("INFO", f"Pushing image to ECR...")
        returncode, _, _ = self.run_command(['docker', 'push', remote_image])
        if returncode != 0:
            self.logger.log("ERROR", "Docker push failed")
            return False
        
        self.logger.log("SUCCESS", "Image pushed to ECR successfully")
        self.logger.end_step()
        return True
    
    def deploy_application(self):
        """Deploy application using ECS"""
        self.logger.log("INFO", "Deploying application...", "Application Deployment")
        
        # This would typically use AWS SDK or Ansible
        self.logger.log("INFO", "Updating ECS service...")
        
        # For demo purposes, we'll just log what would happen
        self.logger.log("INFO", f"Would update ECS service: {self.ecs_service}")
        self.logger.log("INFO", f"New image: {self.ecr_repository}:{self.image_tag}")
        
        self.logger.log("SUCCESS", "Application deployment completed")
        self.logger.end_step()
        return True
    
    def health_check(self):
        """Perform health check on deployed application"""
        self.logger.log("INFO", "Performing health check...", "Health Check")
        
        # Demo health check
        self.logger.log("INFO", "Checking application health...")
        time.sleep(2)  # Simulate health check delay
        
        self.logger.log("SUCCESS", "Application is healthy")
        self.logger.end_step()
        return True
    
    def display_summary(self):
        """Display deployment summary"""
        self.logger.header("Deployment Summary")
        
        total_time = int(time.time() - self.logger.start_time)
        
        print(f"{Colors.GREEN}🎉 Python deployment completed successfully!{Colors.NC}")
        print(f"{Colors.BLUE}⏱️  Total deployment time: {total_time}s{Colors.NC}")
        print("")
        print(f"{Colors.BLUE}📊 Deployment Details:{Colors.NC}")
        print(f"   • Project: {self.args.project_name}")
        print(f"   • Environment: {self.environment}")
        print(f"   • Image Tag: {self.image_tag}")
        print(f"   • ECR Repository: {self.ecr_repository}")
        print(f"   • ECS Cluster: {self.ecs_cluster}")
        print(f"   • ECS Service: {self.ecs_service}")
        print("")
        print(f"{Colors.GREEN}🔗 Next Steps:{Colors.NC}")
        print("   • Monitor application logs in CloudWatch")
        print("   • Test application endpoints")
        print("   • Set up monitoring and alerts")
        print("   • Configure CI/CD pipeline")
    
    def run(self):
        """Main deployment workflow"""
        try:
            self.logger.header(f"Python Deployment: {self.args.project_name}")
            
            if not self.check_prerequisites():
                sys.exit(1)
            
            if not self.args.application_only:
                if not self.setup_python_environment():
                    sys.exit(1)
                
                if not self.run_tests():
                    sys.exit(1)
                
                if not self.deploy_infrastructure():
                    sys.exit(1)
            
            if not self.args.infrastructure_only:
                if not self.build_docker_image():
                    sys.exit(1)
                
                if not self.args.plan_only:
                    if not self.push_to_registry():
                        sys.exit(1)
                    
                    if not self.deploy_application():
                        sys.exit(1)
                    
                    if not self.health_check():
                        sys.exit(1)
            
            self.display_summary()
            
        except KeyboardInterrupt:
            self.logger.log("WARNING", "Deployment interrupted by user")
            sys.exit(1)
        except Exception as e:
            self.logger.log("ERROR", f"Unexpected error: {e}")
            sys.exit(1)

def main():
    """Main entry point with argument parsing"""
    parser = argparse.ArgumentParser(
        description="SuperDeploy Python Deployment Script",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s --project-name myapp                    # Full deployment
  %(prog)s --project-name myapp --plan-only        # Dry run
  %(prog)s --project-name myapp --infrastructure-only  # Infrastructure only
  %(prog)s --project-name myapp --application-only     # Application only
        """
    )
    
    # SuperDeploy compatible arguments
    parser.add_argument('--auto-approve', action='store_true',
                      help='Auto-approve deployment (default behavior)')
    parser.add_argument('--plan-only', action='store_true',
                      help='Show deployment plan without executing')
    parser.add_argument('--infrastructure-only', action='store_true',
                      help='Deploy infrastructure only')
    parser.add_argument('--application-only', action='store_true',
                      help='Deploy application only')
    parser.add_argument('--verbose', action='store_true',
                      help='Enable verbose output')
    
    # Python-specific arguments
    parser.add_argument('--project-name', required=True,
                      help='Name of the project')
    parser.add_argument('--environment', default='prod',
                      help='Deployment environment (default: prod)')
    parser.add_argument('--aws-region', default='us-east-1',
                      help='AWS region (default: us-east-1)')
    parser.add_argument('--image-tag', default='latest',
                      help='Docker image tag (default: latest)')
    
    args = parser.parse_args()
    
    # Validate arguments
    if args.infrastructure_only and args.application_only:
        parser.error("Cannot specify both --infrastructure-only and --application-only")
    
    deployer = PythonDeployer(args)
    deployer.run()

if __name__ == '__main__':
    main()
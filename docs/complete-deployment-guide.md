# Complete Deployment Guide

This comprehensive guide covers deployment strategy, CI/CD pipeline, and manual deployment procedures for the Certifai AWS Lambda project.

## Table of Contents

1. [Overview](#overview)
2. [Branch Strategy](#branch-strategy)
3. [Environment Configuration](#environment-configuration)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [Deployment Procedures](#deployment-procedures)
6. [Testing Your Deployment](#testing-your-deployment)
7. [Manual Deployment](#manual-deployment)
8. [Monitoring and Troubleshooting](#monitoring-and-troubleshooting)
9. [Cleanup](#cleanup)
10. [Best Practices](#best-practices)

## Overview

This project uses a three-environment deployment strategy with automatic CI/CD through GitHub Actions. Each environment is completely independent, allowing for flexible deployment workflows and proper separation of concerns.

**Environments:**

- **Development** (`dev`) - Active development and feature testing
- **Staging** (`staging`) - Pre-production testing and validation
- **Production** (`prod`) - Live production environment

## Branch Strategy

| Branch    | Environment | Deployment Trigger | Description                                                 |
| --------- | ----------- | ------------------ | ----------------------------------------------------------- |
| `develop` | Development | Push to develop    | Development environment for active development and testing  |
| `staging` | Staging     | Push to staging    | Pre-production environment for final testing and validation |
| `master`  | Production  | Push to master     | Live production environment                                 |

### Key Features:

- **Independent Deployments**: Each environment deploys independently based on its branch
- **Pull Request Protection**: Pull requests can be made to `staging` and `master` branches for code review
- **Parallel Workflows**: Staging and production deployments don't depend on each other

## Environment Configuration

### GitHub Secrets Required

Go to your GitHub repository settings → Secrets and variables → Actions, and add:

**AWS Credentials:**

- `AWS_ACCESS_KEY_ID` - Your AWS access key
- `AWS_SECRET_ACCESS_KEY` - Your AWS secret key

**MailerLite API Keys (per environment):**

- `MAILERLITE_API_KEY_DEV` - Development environment API key
- `MAILERLITE_API_KEY_STAGING` - Staging environment API key
- `MAILERLITE_API_KEY_PROD` - Production environment API key

### SAM Configuration

Each environment has its own configuration in `samconfig.toml`:

**Development Environment:**

- **Stack Name**: `certifai-aws-lambda-dev`
- **Environment**: `dev`

**Staging Environment:**

- **Stack Name**: `certifai-aws-lambda-staging`
- **Environment**: `staging`

**Production Environment:**

- **Stack Name**: `certifai-aws-lambda-prod`
- **Environment**: `prod`

## CI/CD Pipeline

### Pipeline Structure

The GitHub Actions CI/CD pipeline includes:

1. **Test & Lint** - Runs on every push and PR to all branches
2. **Deploy to Development** - Triggered on push to `develop` branch
3. **Deploy to Staging** - Triggered on push to `staging` branch
4. **Deploy to Production** - Triggered on push to `master` branch

### Pipeline Features

- ✅ **Automated Testing** - Runs tests and linting before deployment
- ✅ **Multi-Environment** - Separate dev, staging, and production environments
- ✅ **Environment-Specific Secrets** - Different API keys per environment
- ✅ **Independent Deployment** - Each environment deploys independently
- ✅ **Health Checks** - Post-deployment verification for each environment
- ✅ **Notifications** - Clear success/failure messages for each deployment

### Workflow Process

1. **Testing**: All deployments require tests to pass first
2. **Build**: TypeScript compilation and SAM build
3. **Deploy**: Environment-specific deployment using SAM
4. **Health Check**: Post-deployment verification
5. **Notification**: Success/failure status messages

## Deployment Procedures

### Development Deployment

Deploy to development environment for testing new features:

```bash
git checkout develop
git add .
git commit -m "Add new feature"
git push origin develop
```

**What happens:**

- Tests run automatically
- Deploys to `certifai-aws-lambda-dev` stack
- Health check verifies deployment

### Staging Deployment

Deploy to staging for pre-production validation:

```bash
git checkout staging
git merge develop  # or merge your feature branch
git push origin staging
```

**What happens:**

- Tests run automatically
- Deploys to `certifai-aws-lambda-staging` stack
- Health check verifies deployment

### Production Deployment

Deploy to production for live environment:

```bash
git checkout master
git merge staging  # recommended: merge from staging after validation
git push origin master
```

**What happens:**

- Tests run automatically
- Deploys to `certifai-aws-lambda-prod` stack
- Production-specific health check
- Critical failure notifications if deployment fails

## Testing Your Deployment

### Environment URLs

After deployment, your API endpoints will be:

**Development:**

- Base URL: `https://{api-id}.execute-api.us-east-1.amazonaws.com/dev/`
- Health Check: `https://{api-id}.execute-api.us-east-1.amazonaws.com/dev/health`

**Staging:**

- Base URL: `https://{api-id}.execute-api.us-east-1.amazonaws.com/staging/`
- Health Check: `https://{api-id}.execute-api.us-east-1.amazonaws.com/staging/health`

**Production:**

- Base URL: `https://{api-id}.execute-api.us-east-1.amazonaws.com/prod/`
- Health Check: `https://{api-id}.execute-api.us-east-1.amazonaws.com/prod/health`

### API Testing

Test the health check endpoint for each environment:

```bash
# Development
curl https://YOUR_DEV_API_ENDPOINT/health

# Staging
curl https://YOUR_STAGING_API_ENDPOINT/health

# Production
curl https://YOUR_PROD_API_ENDPOINT/health
```

Test user registration:

```bash
curl -X POST https://YOUR_API_ENDPOINT/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test User"}'
```

### Finding Your URLs

Find the actual URLs in:

- AWS Console → CloudFormation → Your Stack → Outputs
- GitHub Actions deployment logs

## Manual Deployment

If you prefer to deploy manually instead of using the CI/CD pipeline:

### Prerequisites

1. Install AWS CLI and configure credentials
2. Install SAM CLI
3. Install Node.js dependencies

### Manual Deployment Steps

```bash
# Install dependencies
npm ci

# Build TypeScript
npm run build

# Build SAM application
sam build

# Deploy with guided setup
sam deploy --guided

# Or deploy to specific environment
sam deploy --config-env dev      # Development
sam deploy --config-env staging  # Staging
sam deploy --config-env prod     # Production
```

### Environment-Specific Manual Deployment

```bash
# Development
sam deploy --config-env dev --parameter-overrides MailerLiteApiKey=YOUR_DEV_KEY

# Staging
sam deploy --config-env staging --parameter-overrides MailerLiteApiKey=YOUR_STAGING_KEY

# Production
sam deploy --config-env prod --parameter-overrides MailerLiteApiKey=YOUR_PROD_KEY
```

## Monitoring and Troubleshooting

### GitHub Actions Monitoring

Monitor your deployments in the Actions tab of your GitHub repository:

1. Go to your repository on GitHub
2. Click the "Actions" tab
3. View workflow runs and their status
4. Click on individual runs for detailed logs

### AWS Console Monitoring

Check deployment status in AWS Console:

- **CloudFormation** → Stacks → Your stack
- **Lambda** → Functions → Your functions
- **API Gateway** → APIs → Your API
- **CloudWatch** → Logs → Log groups

### Common Issues

**Deployment Fails:**

- Check GitHub Actions logs for error details
- Verify all required secrets are configured
- Ensure AWS credentials have proper permissions

**Health Check Fails:**

- Verify API Gateway is properly configured
- Check Lambda function logs in CloudWatch
- Ensure environment variables are set correctly

**Tests Fail:**

- Fix test failures before attempting deployment
- Check test logs in GitHub Actions
- Ensure all dependencies are properly installed

## Cleanup

### Delete Environment Stacks

To delete environment stacks when no longer needed:

```bash
# Delete development
sam delete --stack-name certifai-aws-lambda-dev

# Delete staging
sam delete --stack-name certifai-aws-lambda-staging

# Delete production (be very careful!)
sam delete --stack-name certifai-aws-lambda-prod
```

### Using AWS Console

1. Go to CloudFormation in AWS Console
2. Select the stack you want to delete
3. Click "Delete" and confirm

**⚠️ Warning:** Deleting production stacks will permanently remove your live environment!

## Best Practices

### Development Workflow

1. **Feature Development:**

   - Create feature branches from `develop`
   - Test locally before pushing
   - Merge to `develop` for testing in dev environment

2. **Staging Validation:**

   - Merge stable features from `develop` to `staging`
   - Perform thorough testing in staging environment
   - Validate with stakeholders before production

3. **Production Deployment:**
   - Only merge well-tested code from `staging` to `master`
   - Monitor production deployments closely
   - Have rollback plan ready

### Code Review Process

- Create pull requests to `staging` or `master` for code review
- Require approval before merging to production branches
- Use draft PRs for work-in-progress features

### Environment Management

- Test thoroughly in `develop` before promoting to `staging`
- Validate in `staging` before promoting to `master`
- Keep environment configurations in sync
- Use environment-specific secrets and configurations

### Security Considerations

- Never commit API keys or sensitive data
- Use GitHub secrets for all credentials
- Regularly rotate API keys and access credentials
- Monitor AWS usage and costs

### Deployment Safety

- Always run tests before deploying
- Monitor deployments and have rollback procedures ready
- Use health checks to verify successful deployments
- Keep deployment logs for troubleshooting

---

This guide provides comprehensive coverage of all deployment aspects. For specific technical issues, refer to the individual configuration files in the repository or consult the AWS and GitHub Actions documentation.

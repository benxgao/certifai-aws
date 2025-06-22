# GitHub Repository Setup Guide

Follow these steps to set up CI/CD for your AWS Lambda project.

## 1. Repository Settings

### Required Secrets

Navigate to **Settings > Secrets and variables > Actions** and add:

```
AWS_ACCESS_KEY_ID          # Your AWS access key
AWS_SECRET_ACCESS_KEY      # Your AWS secret access key
MAILERLITE_API_KEY_DEV     # MailerLite API key for development
MAILERLITE_API_KEY_STAGING # MailerLite API key for staging
MAILERLITE_API_KEY_PROD    # MailerLite API key for production
```

### Environment Configuration

Navigate to **Settings > Environments** and create:

#### Development Environment

- **Name**: `development`
- **Deployment branches**: `develop`
- **Environment secrets**: None (uses repository secrets)

#### Staging Environment

- **Name**: `staging`
- **Deployment branches**: `main`
- **Environment secrets**: None (uses repository secrets)

#### Production Environment

- **Name**: `production`
- **Deployment branches**: `main`
- **Required reviewers**: Add your team members
- **Wait timer**: 5 minutes (optional)
- **Environment secrets**: None (uses repository secrets)

## 2. AWS IAM Setup

### Create IAM User for GitHub Actions

1. **Create IAM User:**

   ```bash
   aws iam create-user --user-name github-actions-certifai-aws
   ```

2. **Create IAM Policy:**

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "cloudformation:*",
           "s3:*",
           "lambda:*",
           "apigateway:*",
           "iam:PassRole",
           "iam:GetRole",
           "iam:CreateRole",
           "iam:DeleteRole",
           "iam:PutRolePolicy",
           "iam:DeleteRolePolicy",
           "iam:AttachRolePolicy",
           "iam:DetachRolePolicy",
           "logs:*"
         ],
         "Resource": "*"
       }
     ]
   }
   ```

3. **Attach Policy:**

   ```bash
   aws iam put-user-policy \
     --user-name github-actions-certifai-aws \
     --policy-name GitHubActionsCertifaiAWSPolicy \
     --policy-document file://policy.json
   ```

4. **Create Access Keys:**
   ```bash
   aws iam create-access-key --user-name github-actions-certifai-aws
   ```

## 3. Branch Protection Rules

Navigate to **Settings > Branches** and add protection rules:

### Main Branch Protection

- **Branch name pattern**: `main`
- **Require pull request reviews**: ✅
- **Require status checks**: ✅
  - Select: `Validate Pull Request / validate`
- **Require branches to be up to date**: ✅
- **Restrict pushes that create files**: ✅

### Develop Branch Protection

- **Branch name pattern**: `develop`
- **Require status checks**: ✅
  - Select: `Validate Pull Request / validate` (for PRs to develop)

## 4. Workflow Permissions

Navigate to **Settings > Actions > General**:

- **Actions permissions**: Allow all actions and reusable workflows
- **Workflow permissions**: Read and write permissions
- **Allow GitHub Actions to create and approve pull requests**: ✅

## 5. Testing the Setup

### 1. Test PR Validation

```bash
# Create a feature branch
git checkout -b feature/test-ci-cd
echo "// Test change" >> src/handlers/healthCheck.ts
git add .
git commit -m "test: CI/CD setup"
git push origin feature/test-ci-cd

# Create PR to develop - should trigger validation
```

### 2. Test Development Deployment

```bash
# Merge to develop
git checkout develop
git merge feature/test-ci-cd
git push origin develop

# Should trigger development deployment
```

### 3. Test Staging Deployment

```bash
# Merge to main
git checkout main
git merge develop
git push origin main

# Should trigger staging deployment
```

## 6. Monitoring and Verification

### GitHub Actions

- Check **Actions** tab for workflow runs
- Review logs for any failures
- Verify deployment status

### AWS Console

- CloudFormation: Check stack creation/updates
- Lambda: Verify function deployments
- API Gateway: Test endpoints
- CloudWatch: Monitor logs and metrics

### Manual Testing

```bash
# Test health check endpoint
curl https://your-api-gateway-url/health

# Test user registration endpoint
curl -X POST https://your-api-gateway-url/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test User"}'
```

## 7. Troubleshooting

### Common Issues

1. **AWS Permissions**: Ensure IAM user has sufficient permissions
2. **Secret Names**: Verify secret names match exactly in workflows
3. **Environment Names**: Ensure environment names match workflow references
4. **SAM Template**: Validate template syntax with `sam validate`

### Debug Commands

```bash
# Local testing
npm run build
sam build
sam local start-api

# Validate SAM template
sam validate

# Check AWS credentials
aws sts get-caller-identity
```

## 8. Next Steps

After setup is complete:

1. **Monitor first deployments** closely
2. **Test all endpoints** in each environment
3. **Set up monitoring alerts** in CloudWatch
4. **Document environment-specific configurations**
5. **Train team members** on the CI/CD process

## 🎉 Setup Complete!

Your CI/CD pipeline is now ready. The workflow will:

- ✅ Automatically test and validate all pull requests
- ✅ Deploy to development when pushing to `develop`
- ✅ Deploy to staging and production when pushing to `main`
- ✅ Allow manual deployments and rollbacks
- ✅ Provide comprehensive logging and monitoring

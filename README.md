# AWS Lambda Functions for MailerLite Integration

This project provides AWS Lambda functions for:

- Health check endpoint
- User registration with MailerLite integration

## 🏗️ Architecture

The project follows AWS Lambda best practices with:

- **TypeScript** for type safety
- **AWS SAM** for infrastructure as code
- **Structured logging** with JSON format
- **Input validation** using Joi
- **Error handling** with proper HTTP status codes
- **CORS** enabled for browser compatibility
- **Unit tests** with Jest

## 📁 Project Structure

```
certifai-aws/
├── src/
│   ├── handlers/           # Lambda function handlers
│   │   ├── healthCheck.ts
│   │   ├── userRegistration.ts
│   │   └── __tests__/      # Handler tests
│   ├── services/           # External service integrations
│   │   └── mailerLiteService.ts
│   ├── utils/              # Utility functions
│   │   ├── logger.ts
│   │   ├── response.ts
│   │   └── validation.ts
│   └── types/              # TypeScript type definitions
│       └── index.ts
├── template.yaml           # AWS SAM template
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- AWS CLI configured
- AWS SAM CLI installed
- MailerLite API key

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` with your MailerLite API key:

```bash
MAILERLITE_API_KEY=your_actual_api_key_here
NODE_ENV=dev
```

### 3. Build the Project

```bash
npm run build
```

### 4. Local Development

Start the API locally:

```bash
npm run local
```

This will start the API Gateway locally at `http://localhost:3000`

### 5. Test the Endpoints

**Health Check:**

```bash
curl http://localhost:3000/health
```

**User Registration:**

```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

## 📋 API Endpoints

### GET /health

Health check endpoint that returns service status.

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2023-06-19T10:00:00.000Z",
  "version": "1.0.0",
  "environment": "dev"
}
```

### POST /register

Registers a user with MailerLite.

**Request Body:**

```json
{
  "email": "user@example.com", // Required
  "firstName": "John", // Optional
  "lastName": "Doe", // Optional
  "fields": {
    // Optional custom fields
    "company": "Example Corp",
    "phone": "+1234567890"
  },
  "groups": ["newsletter", "updates"] // Optional group IDs
}
```

**Success Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "subscriberId": "12345"
}
```

**Error Response:**

```json
{
  "error": "Bad Request",
  "message": "Please provide a valid email address",
  "timestamp": "2023-06-19T10:00:00.000Z"
}
```

## 🧪 Testing

Run all tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## 🔍 Code Quality

**Linting:**

```bash
npm run lint
npm run lint:fix
```

**Build:**

```bash
npm run build
```

## 🚀 Deployment

### Deploy to AWS

1. **Configure SAM parameters:**

Create a `samconfig.toml` file or use the guided deployment:

```bash
sam deploy --guided
```

2. **Set environment variables:**

During deployment, you'll be prompted for:

- `Environment`: dev/staging/prod
- `MailerLiteApiKey`: Your MailerLite API key

3. **Local Development Deploy (Optional):**

For local testing and development, you can manually deploy using:

```bash
npm run deploy:local
```

**Note:** Production deployments are handled automatically by CI/CD pipelines.

### Environment Variables

The following environment variables are required:

- `MAILERLITE_API_KEY`: Your MailerLite API key
- `NODE_ENV`: Environment (dev/staging/prod)

## 📊 Monitoring and Logging

The application uses structured JSON logging that's compatible with AWS CloudWatch. All logs include:

- Timestamp
- Log level (info, warn, error, debug)
- Request ID for tracing
- Contextual metadata

Example log entry:

```json
{
  "level": "info",
  "message": "User registration completed successfully",
  "timestamp": "2023-06-19T10:00:00.000Z",
  "meta": {
    "email": "user@example.com",
    "subscriberId": "12345",
    "requestId": "abc-123-def"
  }
}
```

## � CI/CD Pipeline

This project includes a comprehensive GitHub Actions CI/CD pipeline that automates testing, building, and deployment.

### Workflow Overview

The CI/CD pipeline consists of three main workflows:

1. **CI/CD Pipeline** (`.github/workflows/ci-cd.yml`): Automated deployments
2. **PR Validation** (`.github/workflows/pr-validation.yml`): Pull request checks
3. **Manual Deployment** (`.github/workflows/manual-deploy.yml`): On-demand deployments

### Branch Strategy

- **`develop`** → Automatically deploys to **Development** environment
- **`main`** → Automatically deploys to **Staging**, then **Production** environments
- **Pull Requests** → Runs validation checks (lint, test, build, SAM validate)

### Environment Setup

#### 1. GitHub Secrets

Configure the following secrets in your GitHub repository:

**Required for all environments:**

```
AWS_ACCESS_KEY_ID          # AWS access key for deployment
AWS_SECRET_ACCESS_KEY      # AWS secret key for deployment
```

**Environment-specific MailerLite API keys:**

```
MAILERLITE_API_KEY_DEV     # MailerLite API key for development
MAILERLITE_API_KEY_STAGING # MailerLite API key for staging
MAILERLITE_API_KEY_PROD    # MailerLite API key for production
```

#### 2. GitHub Environments

Create the following environments in your GitHub repository settings:

- `development` (auto-deploys from `develop` branch)
- `staging` (auto-deploys from `main` branch)
- `production` (requires manual approval after staging)

### Deployment Process

#### Automatic Deployments

1. **Development**: Push to `develop` branch

   ```bash
   git checkout develop
   git add .
   git commit -m "feat: new feature"
   git push origin develop
   ```

2. **Staging & Production**: Push to `main` branch
   ```bash
   git checkout main
   git merge develop
   git push origin main
   ```

#### Manual Deployments

Use the "Manual Deployment" workflow for:

- Emergency hotfixes
- Specific version deployments
- Rollbacks

1. Go to **Actions** tab in GitHub
2. Select **Manual Deployment** workflow
3. Click **Run workflow**
4. Choose environment and action (deploy/rollback)

### Pipeline Features

- ✅ **Automated Testing**: Runs Jest tests with coverage
- ✅ **Code Quality**: ESLint validation and TypeScript checks
- ✅ **Security**: npm audit for vulnerabilities
- ✅ **SAM Validation**: Template and build validation
- ✅ **Multi-Environment**: Separate dev/staging/prod deployments
- ✅ **Manual Controls**: On-demand deployment and rollback
- ✅ **PR Checks**: Comprehensive validation for pull requests
- ✅ **Environment Protection**: Production requires approval

### Monitoring Deployments

1. **GitHub Actions**: Monitor workflow runs in the Actions tab
2. **AWS CloudFormation**: Check stack status in AWS Console
3. **CloudWatch**: Monitor Lambda function logs and metrics
4. **Health Checks**: Automated post-deployment verification

### Rollback Procedure

#### Automated Rollback (via GitHub)

1. Go to **Actions** → **Manual Deployment**
2. Select environment and "rollback" action
3. Follow AWS CloudFormation rollback process

#### Manual Rollback (via AWS Console)

1. Go to CloudFormation in AWS Console
2. Select the stack (`certifai-aws-lambda-{env}`)
3. Choose "Update" → "Replace current template"
4. Select previous template version
5. Update stack

### Troubleshooting CI/CD

#### Common Issues

1. **AWS Credentials**: Ensure secrets are correctly set
2. **SAM Build Failures**: Check TypeScript compilation errors
3. **Deployment Timeouts**: Verify CloudFormation stack limits
4. **Environment Conflicts**: Ensure unique stack names per environment

#### Debug Steps

1. Check GitHub Actions logs for detailed error messages
2. Review CloudFormation events in AWS Console
3. Examine CloudWatch logs for runtime issues
4. Validate SAM template syntax locally: `sam validate`

## �🔒 Security Considerations

- API keys are stored as environment variables and GitHub secrets
- Input validation prevents injection attacks
- CORS is properly configured
- Error messages don't expose sensitive information
- Request/response logging excludes sensitive data
- CI/CD pipeline uses least-privilege AWS IAM permissions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📝 Development Scripts

- `npm run build` - Compile TypeScript
- `npm run watch` - Watch for changes and recompile
- `npm run clean` - Remove build artifacts
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run local` - Start local development server
- `npm run deploy:local` - Manual local deployment (development only)

## 🔧 Troubleshooting

### Common Issues

1. **MailerLite API errors:**

   - Verify your API key is correct
   - Check MailerLite account limits
   - Review MailerLite API documentation

2. **Local development issues:**

   - Ensure AWS SAM CLI is installed
   - Check Node.js version compatibility
   - Verify all dependencies are installed

3. **Deployment issues:**
   - Ensure AWS CLI is configured
   - Check IAM permissions
   - Verify template.yaml syntax

### Getting Help

- Check the AWS SAM documentation
- Review MailerLite API documentation
- Check CloudWatch logs for runtime errors

## Security Notes

- Never commit AWS credentials to version control
- Use IAM roles in production
- Rotate access keys regularly
- Follow principle of least privilege

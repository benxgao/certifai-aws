# CertifAI AWS - Local Development Setup

## AWS Credentials Setup

### 1. Generate AWS Access Keys

1. Sign in to the [AWS Management Console](https://console.aws.amazon.com/)
2. Navigate to **IAM** > **Users**
3. Select your user or create a new one
4. Go to **Security credentials** tab
5. Click **Create access key**
6. Choose **Command Line Interface (CLI)** as use case
7. Download or copy your **Access Key ID** and **Secret Access Key**

### 2. Configure Local Credentials

#### Option A: AWS CLI

```bash
# Install AWS CLI
pip install awscli

# Configure credentials
aws configure
```

#### Option B: Environment Variables

```bash
export AWS_ACCESS_KEY_ID=your_access_key_here
export AWS_SECRET_ACCESS_KEY=your_secret_key_here
export AWS_DEFAULT_REGION=us-east-1
```

#### Option C: Credentials File

Create `~/.aws/credentials`:

```ini
[default]
aws_access_key_id = your_access_key_here
aws_secret_access_key = your_secret_key_here
```

## Local Development Environment

### Prerequisites

- Node.js (v18+)
- npm or yarn
- AWS CLI

### Setup

```bash
# Clone repository
git clone <repo-url>
cd certifai-aws

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your settings
nano .env

# Start development server
npm run dev
```

### Verify Setup

```bash
brew install aws-sam-cli
# Test AWS connection
aws sts get-caller-identity
```

## Testing with Postman

### Start Local Server

Before testing with Postman, start the local SAM development server:

```bash
# Build the SAM application
sam build

# Start the local API server
sam local start-api
```

The local server will start on `http://localhost:3000` by default.

### Health Check Endpoint Testing

#### Method 1: Using Postman GUI

1. **Open Postman** and create a new request
2. **Set the HTTP method** to `GET`
3. **Enter the URL**: `http://localhost:3000/health`
4. **Add Headers** (optional but recommended):
   - `Content-Type`: `application/json`
   - `Accept`: `application/json`
5. **Click Send**

#### Expected Response

You should receive a `200 OK` response with the following JSON structure:

```json
{
  "status": "healthy",
  "timestamp": "2025-06-19T10:30:45.123Z",
  "version": "1.0.0",
  "environment": "development"
}
```

#### Method 2: Using Postman Collection

You can also create a Postman collection for easier testing:

1. **Create a new collection** named "CertifAI AWS Local Testing"
2. **Add a new request** with:
   - **Name**: "Health Check"
   - **Method**: `GET`
   - **URL**: `http://localhost:3000/health`
3. **Save the request** to the collection
4. **Run the collection** to test multiple endpoints

#### Troubleshooting

- **Connection refused**: Ensure the SAM local server is running (`sam local start-api`)
- **404 Not Found**: Verify the endpoint path is `/health` (not `/healthcheck`)
- **500 Internal Server Error**: Check the terminal logs where SAM is running for error details
- **Timeout**: The first request may take longer as Lambda needs to initialize

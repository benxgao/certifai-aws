## IAM

## Step 1: Go to IAM Console

Navigate to: https://console.aws.amazon.com/iam/
Click on "Users" in the left sidebar
Search for and click on "certifai-admin"

## Step 2: Add CloudFormation Permissions

Option A: Attach AWS Managed Policy (Quickest)
Click on the "Permissions" tab
Click "Add permissions" → "Attach policies directly"
Search for and select these policies:
CloudFormationFullAccess
AmazonS3FullAccess
IAMFullAccess
AWSLambdaFullAccess
AmazonAPIGatewayAdministrator
Click "Add permissions"

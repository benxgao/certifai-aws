# CloudFormation Template Configuration - "Unresolved !Ref tag" Fix

## Issue Resolution Summary

The "unresolved !Ref tag" issue has been resolved through multiple configuration changes:

### 1. VS Code YAML Configuration (`.vscode/settings.json`)

- **Added custom YAML tags**: Configured VS Code to recognize all CloudFormation intrinsic functions (`!Ref`, `!GetAtt`, `!Sub`, etc.)
- **Disabled strict YAML validation**: Prevents VS Code from treating CloudFormation functions as invalid YAML
- **Set proper file associations**: Associates `.yaml` files with YAML language support

### 2. Extension Recommendations (`.vscode/extensions.json`)

Recommended extensions for better AWS development experience:

- `aws-scripting-guy.cform` - CloudFormation language support
- `redhat.vscode-yaml` - Enhanced YAML language features
- `aws.aws-toolkit-vscode` - Complete AWS development toolkit
- `ms-vscode.vscode-json` - JSON language support

### 3. SAM Tasks Configuration (`.vscode/tasks.json`)

Added VS Code tasks for common SAM operations:

- **SAM Build**: Builds the SAM application
- **SAM Deploy (Guided)**: Guided deployment process
- **SAM Validate**: Validates the CloudFormation template
- **SAM Local Start API**: Runs API Gateway locally for testing

### 4. Template Structure Improvements

The `template.yaml` was refactored to:

- **Eliminate circular dependencies**: API Gateway is now defined before Lambda functions
- **Maintain proper CloudFormation syntax**: All intrinsic functions preserved
- **Follow SAM best practices**: Proper resource ordering and references

## How to Apply the Fix

1. **Reload VS Code**: Press `Cmd+Shift+P` → "Developer: Reload Window"
2. **Install extensions**: Accept the extension recommendations when prompted
3. **Verify**: The !Ref, !GetAtt, !Sub tags should no longer show as errors

## Template Validation

To verify the template is valid:

```bash
# If SAM CLI is installed
sam validate

# Or use AWS CLI
aws cloudformation validate-template --template-body file://template.yaml
```

## Running the Application

Use the configured VS Code tasks:

1. Press `Cmd+Shift+P`
2. Type "Tasks: Run Task"
3. Select from available SAM tasks

Or use terminal commands:

```bash
sam build
sam deploy --guided
sam local start-api  # For local testing
```

## Root Cause

The issue occurred because:

1. VS Code's YAML language server didn't recognize CloudFormation intrinsic functions
2. No custom tags were configured for CloudFormation functions
3. Missing proper schema association for SAM templates

This configuration ensures CloudFormation templates are properly recognized and validated in VS Code.

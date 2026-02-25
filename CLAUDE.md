# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal notes app project built as a comprehensive AWS/Terraform learning exercise. The system implements a serverless note-taking application with authentication, featuring:

- **Frontend**: React + Vite + TypeScript SPA with Tailwind CSS
- **Backend**: AWS Lambda (Python) + API Gateway + DynamoDB
- **Authentication**: AWS Cognito User Pools
- **Infrastructure**: Fully managed via Terraform with dev/prod environment separation
- **Deployment**: CloudFront CDN + S3 static hosting with custom domains

## Architecture

### Environment Separation

The project uses **complete environment isolation** with separate Terraform state files:

- **Production**: `note-app.kanare.dev` (domain), `api.note-app.kanare.dev` (API)
  - State: `s3://kanare-terraform-state-bucket/prod/terraform.tfstate`
  - Protected resources with `lifecycle.prevent_destroy = true`

- **Development**: `dev.note-app.kanare.dev` (domain), `api-dev.note-app.kanare.dev` (API)
  - State: `s3://kanare-terraform-state-bucket/dev/terraform.tfstate`
  - No lifecycle protection for easier testing

### Infrastructure Components

- **CloudFront** → **S3 Static Website** (React SPA)
- **API Gateway** (with custom domain + rate limiting) → **Lambda** (Python 3.11) → **DynamoDB**
- **Cognito User Pool** (email-based authentication with JWT)
- **ACM Certificates** (managed in us-east-1 for CloudFront/API Gateway)
- **Cloudflare DNS** (optional Terraform-managed DNS records)

### Terraform Module Structure

```
terraform/
├── backend-setup/           # Initial S3 + DynamoDB for state management
├── environments/
│   ├── dev/                 # Dev environment configuration
│   └── prod/                # Prod environment configuration
└── modules/
    ├── s3/                  # S3 bucket module
    ├── lambda/              # Lambda function module
    ├── dynamodb/            # DynamoDB table module
    ├── api-gateway/         # API Gateway module (with Cognito authorizer)
    └── cognito/             # Cognito User Pool module
```

Each environment (`dev`/`prod`) has its own:
- `main.tf` - Resource definitions
- `variables.tf` - Environment-specific variables
- `backend.tf` - S3 backend configuration with unique state key
- `terraform.tfvars` - Variable values (gitignored)

## Common Commands

### Frontend Development

```bash
cd frontend

# Install dependencies
npm ci

# Run development server (localhost:5173)
npm run dev

# Build for production
npm run build

# Lint
npm run lint

# Preview production build
npm run preview
```

### Terraform Operations

**IMPORTANT**: Always work from the environment-specific directory (`terraform/environments/dev` or `terraform/environments/prod`).

```bash
# Navigate to environment
cd terraform/environments/dev  # or prod

# Initialize Terraform (required after cloning or backend changes)
terraform init

# Format code
terraform fmt -recursive

# Validate configuration
terraform validate

# Preview changes
terraform plan

# Apply changes
terraform apply

# View current state
terraform state list

# Show specific resource
terraform show <resource-address>

# View outputs
terraform output
```

### AWS CLI Operations

```bash
# Check S3 bucket exists
aws s3 ls s3://dev.note-app.kanare.dev

# Sync frontend build to S3
aws s3 sync frontend/dist/ s3://dev.note-app.kanare.dev/ --delete

# List CloudFront distributions
aws cloudfront list-distributions --query "DistributionList.Items[*].[Id,Aliases.Items[0]]"

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id <DIST_ID> --paths "/*"

# Check DynamoDB table
aws dynamodb describe-table --table-name NotesTable-dev

# Scan DynamoDB for testing
aws dynamodb scan --table-name NotesTable-dev
```

### Lambda Function Updates

When modifying Lambda code:

```bash
# Update Lambda function code (after Terraform manages the function)
cd lambda-functions
zip -j api-handler.zip api-handler.py
aws lambda update-function-code \
  --function-name note-api-handler-dev \
  --zip-file fileb://api-handler.zip
```

Or re-apply Terraform to update via IaC:
```bash
cd terraform/environments/dev
terraform apply -target=module.lambda_api_handler
```

## Development Workflow

### Making Infrastructure Changes (GitOps Flow)

Infrastructure changes are managed via GitOps — **do not run `terraform apply` manually** except in emergencies.

1. **Create a branch** from `main`
2. **Make changes** in `terraform/environments/dev/` and/or `terraform/modules/`
3. **Open a PR** → CI automatically runs plan for both dev and prod, posts diff as PR comment
4. **Review the plan** in the PR comment before merging
5. **Merge to main** → CI automatically applies to dev (no approval needed)
6. **Approve prod deployment** → A notification appears in GitHub Actions; a Required Reviewer approves to trigger apply to prod

#### Emergency manual apply

If you must apply manually (e.g., CI is broken):

```bash
cd terraform/environments/dev  # or prod
terraform plan
terraform apply
```

### Deploying Frontend Changes

The GitHub Actions workflow automatically deploys on push to `main`:

```bash
# Manual deployment
cd frontend
npm run build

# Dev environment
aws s3 sync dist/ s3://dev.note-app.kanare.dev/ --delete

# Prod environment
aws s3 sync dist/ s3://note-app.kanare.dev/ --delete

# Invalidate CloudFront cache (required for immediate updates)
aws cloudfront create-invalidation --distribution-id <ID> --paths "/*"
```

### Working with Environment Variables

Frontend builds require environment variables:

```bash
# .env.development or .env.production
VITE_API_BASE_URL=https://api-dev.note-app.kanare.dev
VITE_AWS_REGION=ap-northeast-1
VITE_USER_POOL_ID=<from terraform output>
VITE_USER_POOL_CLIENT_ID=<from terraform output>
```

Get Cognito values from Terraform:
```bash
cd terraform/environments/dev
terraform output cognito_user_pool_id
terraform output cognito_user_pool_client_id
```

## CI/CD Pipelines

### Terraform CI/CD (`.github/workflows/terraform.yml`)

GitOps pipeline: **PR → plan preview, merge to main → auto-apply**.

- **Triggers**: Push/PR to `main`/`develop` affecting `terraform/` files
- **Jobs**:
  1. Format check (`terraform fmt -check`)
  2. Validate (both dev and prod environments)
  3. Plan (both dev and prod, posts diff as PR comment on PRs)
  4. Apply dev (auto, only on push to main — no approval needed)
  5. Apply prod (only on push to main — **requires manual approval** via GitHub Environment)

**Flow diagram:**

```
PR:          fmt → validate → plan → [PR comment with diff]
merge main:  fmt → validate → plan → apply dev → [approve?] → apply prod
```

**Setup required (one-time):**
GitHub repository → Settings → Environments → New environment: `production` → Required reviewers → add yourself

### Static Site Deployment (`.github/workflows/deploy-static-site.yml`)

- **Triggers**:
  - Push to `main` → deploys to **prod**
  - PR → deploys to **dev**
  - Manual workflow dispatch → choose environment
- **Process**:
  1. Determines environment
  2. Retrieves Cognito config from Terraform outputs
  3. Builds frontend with environment variables
  4. Syncs to S3
  5. Invalidates CloudFront cache

## Important Notes

### Terraform State Management

- **Never manually edit** state files
- Each environment has isolated state with DynamoDB locking
- To resolve state locks: `terraform force-unlock <LOCK_ID>`
- Backend reconfiguration: `terraform init -reconfigure`

### Production Safeguards

The following resources in **prod** have `prevent_destroy = true`:
- CloudFront Distribution
- ACM Certificates (static site + API)

To destroy protected resources, manually remove the `lifecycle` block first.

### ACM Certificate Validation

- Certificates must be created in **us-east-1** for CloudFront/API Gateway
- DNS validation requires CNAME records in Cloudflare
- With `enable_cloudflare_dns = true`, validation is automated
- Without it, manually add CNAME records shown in `terraform output`

### API Gateway + Cognito

- All API endpoints require Cognito JWT authentication
- The Lambda handler extracts `userId` from `event.requestContext.authorizer.claims.sub`
- API throttling is configured: 50 req/s average, 100 burst, 10k daily quota

### DynamoDB Schema

**NotesTable** (composite key):
- `userId` (Hash Key, String) - Cognito user's `sub` claim
- `noteId` (Range Key, String) - UUID v4
- `title` (String)
- `content` (String) - Markdown supported
- `createdAt` (ISO 8601 timestamp)
- `updatedAt` (ISO 8601 timestamp)

## Troubleshooting

### "State lock" error
```bash
terraform force-unlock <LOCK_ID>
```

### ACM certificate validation stuck
1. Check Cloudflare DNS records exist (or `enable_cloudflare_dns = true`)
2. Ensure Cloudflare proxy is **disabled** (DNS only, grey cloud)
3. Verify CNAME points to correct validation target

### Frontend environment variables not set
Check GitHub Secrets or manually export before build:
```bash
export VITE_USER_POOL_ID=$(cd terraform/environments/dev && terraform output -raw cognito_user_pool_id)
```

### CloudFront still serving old content
Create cache invalidation:
```bash
aws cloudfront create-invalidation --distribution-id <ID> --paths "/*"
```

## Key Files Reference

- `docs/cloudflare-terraform-guide.md` - Cloudflare DNS automation setup
- `adr/` - Architecture Decision Records documenting key design choices
- `diagrams/` - System architecture diagrams and design notes

## Testing Changes

Before committing:

```bash
# Terraform
terraform fmt -check -recursive
cd terraform/environments/dev
terraform validate
terraform plan

# Frontend
cd frontend
npm run lint
npm run build
```

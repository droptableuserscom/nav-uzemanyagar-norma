# NAV Fuel Price Norm API

API for querying current and historical NAV fuel price norms

## 📋 Description

This project is a REST API that enables querying fuel price norms published by NAV (National Tax and Customs Administration). The API automatically updates data from the NAV website and stores it in JSON format. The system scrapes fuel price data from the NAV website and provides both current and historical fuel price information.

## ✨ Features

- **Current fuel prices query**: Query prices for all current fuel types
- **Historical data**: Search by year and month
- **Automatic data updates**: Web scraping from the NAV website
- **Git integration**: Automatic commit and push for data changes
- **Slack notifications**: Webhook integration for notifications (development mode: logs only)
- **OpenAPI documentation**: Automatically generated API documentation
- **Data validation**: Zod schema validation for all data
- **Error handling**: Comprehensive error handling with retry mechanisms

## 🚀 Installation

### Prerequisites

- Node.js (v18 or newer)
- pnpm (recommended) or npm
- Git repository access
- GitHub App private key file (`.pem` format)
- Slack webhook URL for notifications

### GitHub App Setup

This application requires a GitHub App to automatically commit and push data changes. You need to:

1. **Create a GitHub App** in your GitHub organization
2. **Generate a private key** (`.pem` format) for the GitHub App
3. **Install the GitHub App** in your target repository
4. **Configure the environment variables** with your GitHub App details

#### Required GitHub App Permissions:

- **Repository permissions**:
  - Contents: Read and write
  - Metadata: Read-only
- **Organization permissions**: None required

#### Private Key File Setup:

1. Download the private key from your GitHub App settings
2. Save it as a `.pem` file in your project (e.g., `github-app-key.pem`)
3. Update the `GIT_PRIVATE_KEY_PATH` environment variable to point to your key file

### Slack Webhook Setup

This application sends notifications to Slack when data is updated. You need to:

1. **Create a Slack App** in your Slack workspace
2. **Enable Incoming Webhooks** for your Slack App
3. **Create a webhook URL** for the channel where you want to receive notifications
4. **Configure the webhook URL** in your environment variables

#### Slack App Setup Steps:

1. Go to [api.slack.com/apps](https://api.slack.com/apps) and click "Create New App"
2. Choose "From scratch" and give your app a name
3. Select your workspace
4. In the left sidebar, go to "Incoming Webhooks"
5. Toggle "Activate Incoming Webhooks" to On
6. Click "Add New Webhook to Workspace"
7. Choose the channel where you want to receive notifications
8. Copy the webhook URL (starts with `https://hooks.slack.com/services/...`)
9. Add the webhook URL to your `.env` file as `SLACK_WEBHOOK_URL`

#### Webhook URL Format:

```
https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX
```

### Environment Variables

Create a `.env` file in the project root:

```env
# GitHub App configuration
GITHUB_APP_ID=your_github_app_id
GIT_PRIVATE_KEY_PATH=path/to/private/key.pem
GIT_INSTALLATION_ID=your_installation_id
GIT_OWNER_ORG=your_organization
GIT_TARGET_REPO=your_repository
GIT_TARGET_BRANCH=main

# Data file path
DATA_JSON_PATH=src/data.json

# Slack webhook URL
SLACK_WEBHOOK_URL=your_slack_webhook_url

# Environment (development/production)
NODE_ENV=development

# Server port (optional, default: 3000)
PORT=3000
```

### Installation Steps

```bash
# Install dependencies
pnpm install

# Start development mode
pnpm dev

# Build
pnpm build

# Start production
pnpm start
```

## 🐳 Docker

This project includes Docker support for easy deployment and containerization.

### Prerequisites for Docker

- Docker installed on your system
- Docker Compose (optional, for multi-container setups)

### Docker Build

Build the Docker image:

```bash
# Build the image
docker build -t crawler .

# Build with a specific tag
docker build -t crawler:latest .
```

### Docker Run

Run the container:

```bash
# Run the container
docker run -p 3000:3000 crawler
```

### Docker Security Considerations

⚠️ **Important Docker Security Notes:**

- **Private Key Mounting**: Mount your GitHub private key as a read-only volume
- **Environment Variables**: Use Docker secrets or environment files for sensitive data
- **Non-root User**: The container runs as a non-root user (`hono`) for security
- **Port Exposure**: Only expose the necessary port (3000)
- **Image Scanning**: Regularly scan your Docker images for vulnerabilities

### Security Notes

⚠️ **Important Security Considerations:**

- **Private Key Security**: Never commit your GitHub App private key (`.pem` file) to version control
- **Add to .gitignore**: Ensure your private key file is listed in `.gitignore`
- **File Permissions**: Set appropriate file permissions on your private key file (e.g., `chmod 600 github-app-key.pem`)
- **Slack Webhook Security**: Keep your Slack webhook URL secure and never share it publicly
- **Environment Variables**: Keep your `.env` file secure and never commit it to version control

## 📚 API Usage

### Base URL

```
http://localhost:3000
```

### Endpoints

#### 1. API Status

```http
GET /
```

Response: `"NAV Uzemanyagar Norma API is running"`

#### 2. Fuel Prices Query

```http
GET /uzemanyagar
```

**Query parameters:**

- `ev` (optional): Year (e.g., 2023, 2024, 2025)
- `honap` (optional): Month (1-12)

**Behavior based on query parameters:**

- **No query parameters**: Returns the last month's fuel price data
- **Only `ev` parameter**: Returns the entire year's fuel price data for the specified year
- **Both `ev` and `honap` parameters**: Returns the exact month's fuel price data for the specified year and month

**Examples:**

Last month's prices (no query parameters):

```http
GET /uzemanyagar
```

Actual year's specific month prices (only month specified):

````http
GET /uzemanyagar?honap=1

Entire year's prices (only year specified):

```http
GET /uzemanyagar?ev=2025
````

Specific month's prices (year and month specified):

```http
GET /uzemanyagar?ev=2025&honap=8
```

**Response format:**

For current prices:

```json
{
  "olmozatlanMotorbenzin": 596,
  "gazolaj": 600,
  "keverek": 648,
  "lpg": 348,
  "cng": 855
}
```

For yearly data:

```json
{
  "január": {
    "olmozatlanMotorbenzin": 626,
    "gazolaj": 638,
    "keverek": 677,
    "lpg": 379,
    "cng": 800
  },
  "február": {
    "olmozatlanMotorbenzin": 631,
    "gazolaj": 651,
    "keverek": 682,
    "lpg": 392,
    "cng": 825
  }
}
```

#### 3. OpenAPI Documentation

```http
GET /openapi.json
```

#### 4. Webhook (for automatic data updates)

```http
GET /webhook
```

**Note**: The webhook endpoint triggers the scraper service to update fuel price data from the NAV website.

## 🔧 Development Mode

The application supports different behaviors based on the environment:

### Slack Notifications

- **Development mode** (`NODE_ENV=development`): Slack messages are logged to the console instead of being sent to Slack
- **Production mode** (`NODE_ENV=production`): Slack messages are sent to the configured webhook URL

This prevents accidental Slack notifications during development while still allowing you to see what messages would be sent.

### Environment Configuration

Set the `NODE_ENV` environment variable in your `.env` file:

```env
NODE_ENV=development  # For development (logs Slack messages)
NODE_ENV=production   # For production (sends Slack messages)
```

## 📊 Data Coverage

**Fuel types included:**

- `olmozatlanMotorbenzin` - Unleaded gasoline
- `gazolaj` - Diesel
- `keverek` - Blend
- `lpg` - Liquefied petroleum gas
- `cng` - Compressed natural gas

## 🏗️ Project Structure

```
src/
├── config.ts                 # Configuration management
├── index.ts                  # Main application entry point
├── data.json                 # Stored fuel price data (4.4KB, 232 lines)
├── fuel-price/              # Fuel price services
├── git/                     # Git integration
├── persistance/             # Data persistence
├── routes/                  # API routes
├── scraper/                 # Web scraping logic
└── slack/                   # Slack integration
```

## 🔧 Technology Stack

- **Runtime**: Node.js
- **Framework**: Hono (fast, lightweight web framework)
- **Language**: TypeScript
- **Validation**: Zod
- **HTTP Client**: Axios with retry mechanism
- **Web Scraping**: Cheerio
- **Git Integration**: Octokit
- **Documentation**: OpenAPI 3.0
- **Development**: TSX for hot reloading

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🔧 Troubleshooting

### Common Issues

#### Git Integration Problems

- **"Private key not found"**: Ensure `GIT_PRIVATE_KEY_PATH` points to the correct `.pem` file location
- **"Invalid private key"**: Verify the private key file is in the correct PEM format and not corrupted
- **"Permission denied"**: Check file permissions on your private key file (`chmod 600`)
- **"GitHub App not installed"**: Ensure the GitHub App is installed in your target repository

#### Environment Setup Issues

- **"Required environment variable missing"**: Check that all required variables are set in your `.env` file
- **"Invalid webhook URL"**: Verify your Slack webhook URL is correct and accessible

#### Slack Integration Problems

- **"Slack webhook URL not found"**: Ensure `SLACK_WEBHOOK_URL` is set in your `.env` file
- **"Invalid Slack webhook URL"**: Verify the webhook URL format (should start with `https://hooks.slack.com/services/`)
- **"Slack webhook access denied"**: Check that your Slack App has the correct permissions and is installed in the target channel
- **"No Slack notifications"**: In development mode, Slack messages are logged to console instead of being sent

## 📞 Contact

For questions or suggestions, please open an issue in the GitHub repository.

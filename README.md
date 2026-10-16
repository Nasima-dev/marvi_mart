# Marvi Mart — Online Shopping Website

🌐 **Live Demo:** https://marvi-mart.in/

💻 **GitHub Repository:** https://github.com/Nasima-dev/marvi_mart

Marvi Mart is a responsive e-commerce website built with React. It is designed to provide customers with a smooth online shopping experience and store administrators with tools to manage the store.

## Features

- Responsive design for desktop and mobile devices
- Product listing and product browsing
- Shopping cart functionality
- Admin portal for store management
- Backend integration support
- PhonePe payment gateway integration code (requires valid merchant credentials and configuration)
- Cash on Delivery support, depending on the current application configuration

## Tech Stack

- React
- TypeScript
- Vite
- Node.js
- Netlify for deployment

## Getting Started

### Prerequisites

- Node.js and npm
- Git

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Nasima-dev/marvi_mart.git
   ```

2. Open the project folder:

   ```bash
   cd marvi_mart
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Configure environment variables using the project's `.env.example` file. Create a local `.env` or `.env.local` file as required by the application. Never commit real credentials or secret keys.

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open the local URL displayed in your terminal.

## Environment Configuration

Depending on the features enabled in your setup, environment variables may include:

- `MONGODB_URI` — MongoDB database connection
- `ADMIN_PASSWORD` — Admin login configuration
- `ADMIN_TOKEN_SECRET` — Secret used for admin session tokens
- `GEMINI_API_KEY` — Optional Gemini AI features
- `APP_URL` — Application URL
- `PHONEPE_MERCHANT_ID` — PhonePe merchant identifier
- `PHONEPE_SALT_KEY` — PhonePe server-side secret key
- `PHONEPE_SALT_INDEX` — PhonePe key index
- `PHONEPE_ENV` — PhonePe environment, such as UAT or PROD

Use only server-side configuration for payment secrets. Do not expose secret keys in frontend code.

## Deployment

This project can be deployed to Netlify or another compatible hosting platform. Configure the required environment variables and verify backend routes, database connectivity, administrator access, and payment settings before production use.

## Security

- Never commit `.env` files containing real credentials.
- Use strong administrator credentials and a secure token secret.
- Keep payment gateway credentials on the server.
- Test payment flows in the appropriate sandbox environment before enabling live transactions.

## Project Status

This repository contains the Marvi Mart website project. Features requiring external services depend on their configuration and availability.

## Author

**Nasima-dev**

GitHub: https://github.com/Nasima-dev

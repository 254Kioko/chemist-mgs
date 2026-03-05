CHEMIST Management System
Overview

The CHEMIST Management System is a web application designed to help chemists manage inventory, sales, and customer orders efficiently. It solves the problem of manual tracking, reducing errors and streamlining daily operations.
Demo Access

To explore the CHEMIST Management System, use the following demo accounts:

Role	Username	Password
Admin	admin	Chemist!2025@admin
Cashier	cashier	cashier!2025@chemistt

Features

Inventory Management with automatic low-stock alerts via SMS

Sales Tracking and Order Management

User Roles and Authentication for secure access

Dashboard with quick analytics on sales and stock levels

Responsive design for desktops and mobile devices

Technologies Used

Frontend: React, TypeScript, Tailwind CSS

Backend & Database: Supabase (PostgreSQL)

Notifications: Twilio / SMS alerts for low stock

Version Control: GitHub (commit history available)

Hosting / Deployment: Netlify

Installation & Running Locally

Clone the repository:

git clone https://github.com/254Kioko/chemist-mgs.git
cd chemist-mgs

Install dependencies:

npm install

Setup environment variables from .env file (Supabase credentials, Twilio keys, etc.)

Run the project:

npm run dev

Access the application at http://localhost:5173

Login credentials and detailed instructions are included in the README for demo access.

Live Demo

CHEMIST Management System Live

My Contributions

Developed the inventory and product management modules

Implemented SMS alert notifications for low stock items

Designed and integrated the dashboard and responsive UI

Connected frontend to Supabase backend and handled authentication

Future Improvements

Add advanced reporting analytics

Implement role-based dashboards with customizable access

Integrate mobile push notifications

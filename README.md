# Node.js APM (Application Performance Monitoring) Example

This is a Node.js implementation of an APM (Application Performance Monitoring) example, inspired by the provided Go APM code.

## Introduction

This Node.js application serves as an example of integrating Application Performance Monitoring (APM) features using AWS CloudWatch Logs. It includes middleware for starting and ending transactions and segments, as well as logging to CloudWatch Logs.

## Setup

Before running the application, ensure you have Node.js installed. You can install the required packages using:

npm install

# AWS Configuration

Replace the placeholder values in the code with your AWS Access Key, AWS Secret Key, and AWS Region.


const awsAccessKey = "your AWS Access Key";
const awsSecretKey = "your AWS Secret Key";
const awsRegion = "your AWS Region";


# Models
- Course: Represents a course with properties such as courseID, name, price, and language.
- Event: Represents an event with details, detailType, and source.
- Transaction: Represents a transaction with a transactionID, startTime, endTime, and an array of segments.
- Segment: Represents a segment with a segmentID, startTime, and endTime.

# APM Setup
- Event
class Event {
  constructor(details, detailType, source) {
    // ...
  }
}

- Transaction
class Transaction {
  constructor(transactionID, startTime, endTime, segments) {
    // ...
  }
}
- Segment
class Segment {
  constructor(segmentID, startTime, endTime) {
    // ...
  }
}

# Fake Database
- A simple array courses serves as a fake database for course information.

# Middleware and Helper
- Middleware functions for starting and ending transactions are implemented, along with helper functions.

# Routes
-  /: Home route that returns a simple message.
- /courses: Route to get information about all courses.

# Helper Functions

- logToCloudWatchLogs
async function logToCloudWatchLogs(logGroupName, logStreamName, message) {
  // ...
}

- sendEventToCloudWatchLogs
async function sendEventToCloudWatchLogs(logGroupName, logStreamName, eventData) {
  // ...
}

- getLogs
async function getLogs(logGroupName, logStreamNames) {
  // ...
}

# Running the Server
- To start the server, run: 
npm start

- The server will run on port 8000 by default. Make sure to replace placeholder values and configure AWS credentials before running.



const express = require('express');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 8000;

// Models
class Course {
    constructor(courseID, name, price, language) {
        this.courseID = courseID;
        this.name = name;
        this.price = price;
        this.language = language;
    }
}

// APM Setup
class Event {
    constructor(details, detailType, source) {
        this.details = details;
        this.detailType = detailType;
        this.source = source;
    }
}

class Transaction {
    constructor(transactionID, startTime, endTime, segments) {
        this.transactionID = transactionID;
        this.startTime = startTime;
        this.endTime = endTime;
        this.segments = segments;
    }
}

class Segment {
    constructor(segmentID, startTime, endTime) {
        this.segmentID = segmentID;
        this.startTime = startTime;
        this.endTime = endTime;
    }
}

// Fake DataBase
const courses = [
    new Course("1", "Go", 10, "Go"),
    new Course("2", "Python", 20, "Python")
];

// Middleware and Helper
function isEmpty(obj) {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
}

// AWS Configuration
const awsAccessKey = "your AWS Access Key";
const awsSecretKey = "your AWS Secret Key";
const awsRegion = "your AWS Region";

AWS.config.update({
    accessKeyId: awsAccessKey,
    secretAccessKey: awsSecretKey,
    region: awsRegion
});

const cloudWatchLogs = new AWS.CloudWatchLogs();

// APM Functions
function startTransaction() {
    return new Transaction(uuidv4(), new Date(), null, []);
}

function endTransaction(tx) {
    tx.endTime = new Date();

    // Log the transaction
    const event = new Event(tx, "TransactionEvent", "ubc-local");
    const logGroupName = "ubclogs";
    const logStreamName = "ubc";

    // Log event
    sendEventToCloudWatchLogs(logGroupName, logStreamName, event)
        .catch(error => console.error("ERROR #EndTransaction #sending transaction event to CloudWatch Logs: #", error));
}

function startSegment(tx) {
    const segment = new Segment(uuidv4(), new Date(), null);
    tx.segments.push(segment);
    return segment;
}

function endSegment(segment) {
    segment.endTime = new Date();
}

// Middleware
app.use((req, res, next) => {
    const tx = startTransaction();
    req.transaction = tx;
    next();
});

app.use((req, res, next) => {
    res.on('finish', () => {
        const tx = req.transaction;
        if (!isEmpty(tx)) {
            endTransaction(tx);
        }
    });
    next();
});

// Routes
app.get('/', (req, res) => {
    res.send('API is running');
});

app.get('/courses', async (req, res) => {
    // Start a new segment and also end by defer
    const tx = req.transaction;
    if (!isEmpty(tx)) {
        const segment = startSegment(tx);
        res.on('finish', () => endSegment(segment));
    }

    // Log to CloudWatch Logs
    const logGroupName = "ubclogs";
    const logStreamName = "ubc";
    const logMessage = "log is running";

    const event = new Event({ transactionID: tx.transactionID }, "TransactionEvent", "YourApp");

    // Log message
    try {
        await logToCloudWatchLogs(logGroupName, logStreamName, logMessage);
    } catch (error) {
        console.error("Error logging message to CloudWatch Logs:", error);
    }

    // Log event
    try {
        await sendEventToCloudWatchLogs(logGroupName, logStreamName, event);
    } catch (error) {
        console.error("Error sending event to CloudWatch Logs:", error);
    }

    res.json(courses);

    const logStreamNames = [logStreamName];
    await getLogs(logGroupName, logStreamNames);
});

// Helper Functions
async function logToCloudWatchLogs(logGroupName, logStreamName, message) {
    const params = {
        logGroupName: logGroupName,
        logStreamName: logStreamName,
        logEvents: [
            {
                message: message,
                timestamp: new Date().getTime()
            }
        ]
    };

    await cloudWatchLogs.putLogEvents(params).promise();
}

async function sendEventToCloudWatchLogs(logGroupName, logStreamName, eventData) {
    const params = {
        logGroupName: logGroupName,
        logStreamName: logStreamName,
        logEvents: [
            {
                message: JSON.stringify(eventData),
                timestamp: new Date().getTime()
            }
        ]
    };

    await cloudWatchLogs.putLogEvents(params).promise();
}

async function getLogs(logGroupName, logStreamNames) {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 60 * 60 * 1000); // One hour ago

    for (const logStreamName of logStreamNames) {
        const params = {
            logGroupName: logGroupName,
            logStreamNames: [logStreamName],
            startTime: startTime.getTime(),
            endTime: endTime.getTime()
        };

        try {
            const response = await cloudWatchLogs.filterLogEvents(params).promise();
            console.log(`Logs for log stream '${logStreamName}':`);
            response.events.forEach(event => console.log(event.message));
            console.log();
        } catch (error) {
            console.error(`Error fetching logs for log stream '${logStreamName}':`, error);
        }
    }
}

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

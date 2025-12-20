/**
 * MongoDB Test Query Script
 *
 * Queries MongoDB Atlas for records between a specified time period.
 *
 * Usage:
 *   npx tsx mongodb_test_query.ts <collection> <startDate> <endDate> [dateField]
 *
 * Example:
 *   npx tsx mongodb_test_query.ts myCollection 2024-01-01 2024-12-31
 *   npx tsx mongodb_test_query.ts myCollection 2024-01-01 2024-12-31 createdAt
 */

import { closeConnection, getCollection } from "./mongoPool";

interface QueryOptions {
  collectionName: string;
  startDate: Date;
  endDate: Date;
  dateField: string;
}

async function queryByDateRange(options: QueryOptions) {
  const { collectionName, startDate, endDate, dateField } = options;

  try {
    console.log("\n🔍 MongoDB Query Parameters:");
    console.log(`   Collection: ${collectionName}`);
    console.log(`   Date Field: ${dateField}`);
    console.log(`   Start Date: ${startDate.toISOString()}`);
    console.log(`   End Date:   ${endDate.toISOString()}`);
    console.log("\n⏳ Connecting to MongoDB Atlas...\n");

    const collection = await getCollection(collectionName);

    // Build the query
    const query = {
      [dateField]: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    // Execute query and get results
    console.log("📊 Executing query...\n");
    const results = await collection.find(query).toArray();

    console.log(`✅ Found ${results.length} record(s)\n`);

    if (results.length > 0) {
      console.log("📄 Results:");
      console.log("─".repeat(80));
      results.forEach((doc, index) => {
        console.log(`\nRecord ${index + 1}:`);
        console.log(JSON.stringify(doc, null, 2));
      });
      console.log("\n" + "─".repeat(80));
    } else {
      console.log("ℹ️  No records found for the specified date range.");
    }

    // Get count for verification
    const count = await collection.countDocuments(query);
    console.log(`\n📈 Total count: ${count}`);

    return results;
  } catch (error) {
    console.error("\n❌ Error querying MongoDB:");
    console.error(error);
    throw error;
  } finally {
    await closeConnection();
    console.log("\n🔌 Connection closed\n");
  }
}

function parseDate(dateString: string): Date {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error(
      `Invalid date format: ${dateString}. Use YYYY-MM-DD format.`
    );
  }
  return date;
}

function printUsage() {
  console.log(`
Usage: npx tsx mongodb_test_query.ts <collection> <startDate> <endDate> [dateField]

Arguments:
  collection    Name of the MongoDB collection to query
  startDate     Start date in YYYY-MM-DD format (e.g., 2024-01-01)
  endDate       End date in YYYY-MM-DD format (e.g., 2024-12-31)
  dateField     (Optional) Field name to query on (default: "createdAt")

Examples:
  npx tsx mongodb_test_query.ts users 2024-01-01 2024-12-31
  npx tsx mongodb_test_query.ts orders 2024-06-01 2024-06-30 orderDate
  npx tsx mongodb_test_query.ts logs 2024-11-01 2024-11-25 timestamp
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 3 || args.includes("--help") || args.includes("-h")) {
    printUsage();
    process.exit(args.includes("--help") || args.includes("-h") ? 0 : 1);
  }

  const [collectionName, startDateStr, endDateStr, dateField = "createdAt"] =
    args;

  try {
    const startDate = parseDate(startDateStr);
    const endDate = parseDate(endDateStr);

    if (startDate > endDate) {
      throw new Error("Start date must be before or equal to end date");
    }

    await queryByDateRange({
      collectionName,
      startDate,
      endDate,
      dateField,
    });

    process.exit(0);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`\n❌ Error: ${error.message}\n`);
    }
    printUsage();
    process.exit(1);
  }
}

main();

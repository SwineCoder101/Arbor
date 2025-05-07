import { MongoClient } from 'mongodb';
import { BN } from '@drift-labs/sdk';
import { BNConverter } from '../utils/bnConverter.js';

/**
 * This script tests BN handling in MongoDB storage and retrieval using our BNConverter utility
 */
async function testBNHandling() {
  try {
    // Connect to MongoDB
    const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017';
    const dbName = process.env.MONGO_DB || 'test';
    const client = new MongoClient(mongoUrl);
    await client.connect();
    console.log(`Connected to MongoDB at ${mongoUrl}, using database ${dbName}`);

    const db = client.db(dbName);
    const collection = db.collection('bn_test');

    // Clear any existing test data
    await collection.deleteMany({});

    // Create test BN values
    const testValues = {
      positiveBN: new BN('123456789012345678901234567890'),
      negativeBN: new BN('-987654321098765432109876543210'),
      zeroBN: new BN(0),
      nestedBN: {
        level1: {
          level2: new BN('42')
        },
        arrayOfBNs: [new BN(1), new BN(2), new BN(3)]
      },
      mixedTypes: {
        bnValue: new BN(999),
        stringValue: "test string",
        numberValue: 123,
        boolValue: true,
        dateValue: new Date(),
        nullValue: null,
        objectValue: { key: "value" }
      }
    };

    console.log('Original test values:');
    console.log(JSON.stringify(testValues, (key, value) => 
      value instanceof BN ? `BN(${value.toString()})` : value, 2));

    // Convert values for storage using our utility
    const storageValues = BNConverter.toMongoFormat(testValues);
    console.log('\nValues converted for MongoDB storage:');
    console.log(JSON.stringify(storageValues, null, 2));

    // Store in MongoDB
    await collection.insertOne({
      testId: 'bn-test',
      values: storageValues,
      timestamp: new Date()
    });
    console.log('\nValues stored in MongoDB');

    // Retrieve from MongoDB
    const retrievedDoc = await collection.findOne({ testId: 'bn-test' });
    if (!retrievedDoc) {
      throw new Error('Failed to retrieve test document');
    }
    console.log('\nRetrieved from MongoDB:');
    console.log(JSON.stringify(retrievedDoc.values, null, 2));

    // Convert back to BN using our utility
    const processedValues = BNConverter.fromMongoFormat(retrievedDoc.values);
    console.log('\nValues after restoration to BN:');
    console.log(JSON.stringify(processedValues, (key, value) => 
      value instanceof BN ? `BN(${value.toString()})` : value, 2));

    // Verify values are correctly restored
    const verifyBN = (original: BN, restored: BN, path: string) => {
      const originalStr = original.toString();
      const restoredStr = restored.toString();
      
      if (originalStr !== restoredStr) {
        console.error(`❌ BN mismatch at ${path}: Original ${originalStr}, Restored ${restoredStr}`);
      } else {
        console.log(`✅ BN match at ${path}: ${originalStr}`);
      }
    };

    // Verify all BN values
    verifyBN(testValues.positiveBN, processedValues.positiveBN, 'positiveBN');
    verifyBN(testValues.negativeBN, processedValues.negativeBN, 'negativeBN');
    verifyBN(testValues.zeroBN, processedValues.zeroBN, 'zeroBN');
    verifyBN(testValues.nestedBN.level1.level2, processedValues.nestedBN.level1.level2, 'nestedBN.level1.level2');
    verifyBN(testValues.mixedTypes.bnValue, processedValues.mixedTypes.bnValue, 'mixedTypes.bnValue');
    
    for (let i = 0; i < testValues.nestedBN.arrayOfBNs.length; i++) {
      verifyBN(
        testValues.nestedBN.arrayOfBNs[i],
        processedValues.nestedBN.arrayOfBNs[i],
        `nestedBN.arrayOfBNs[${i}]`
      );
    }

    // Verify other types remain unchanged
    console.log(`\nVerifying non-BN values:`);
    console.log(`String: ${testValues.mixedTypes.stringValue === processedValues.mixedTypes.stringValue ? '✅' : '❌'}`);
    console.log(`Number: ${testValues.mixedTypes.numberValue === processedValues.mixedTypes.numberValue ? '✅' : '❌'}`);
    console.log(`Boolean: ${testValues.mixedTypes.boolValue === processedValues.mixedTypes.boolValue ? '✅' : '❌'}`);
    console.log(`Null: ${testValues.mixedTypes.nullValue === processedValues.mixedTypes.nullValue ? '✅' : '❌'}`);
    console.log(`Object: ${JSON.stringify(testValues.mixedTypes.objectValue) === JSON.stringify(processedValues.mixedTypes.objectValue) ? '✅' : '❌'}`);

    // Format decimal example
    console.log('\nFormatted decimal examples:');
    const price = new BN('12345678901234');
    console.log(`Original BN: ${price.toString()}`);
    console.log(`With 0 decimals: ${BNConverter.formatBNWithDecimals(price, 0)}`);
    console.log(`With 6 decimals: ${BNConverter.formatBNWithDecimals(price, 6)}`);
    console.log(`With 8 decimals: ${BNConverter.formatBNWithDecimals(price, 8)}`);
    console.log(`With 10 decimals: ${BNConverter.formatBNWithDecimals(price, 10)}`);

    // Cleanup
    await client.close();
    console.log('\nDisconnected from MongoDB');
    
  } catch (error) {
    console.error('Error in BN handling test:', error);
  }
}

// Run the test
testBNHandling();
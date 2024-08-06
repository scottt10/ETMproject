const mongoose = require('mongoose');
const xss = require('xss');

const dbURI = 'mongodb://localhost:27017/simple'; 

const productSchema = new mongoose.Schema({
  name: String,
  price: String,
  description: String,
  status: Boolean
});

const Product = mongoose.model('Product', productSchema);

async function sanitizeData() {
  try {
    await mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('MongoDB is Connected...');

    const products = await Product.find({});

    for (const product of products) {
      const sanitizedDescription = xss(product.description); // Sanitize description field

      if (sanitizedDescription !== product.description) {
        // Update the document if necessary
        const result = await Product.updateOne(
          { _id: product._id },
          { $set: { description: sanitizedDescription } }
        );
        
        if (result.modifiedCount > 0) {
          console.log(`Sanitized document with id ${product._id}`);
        } else {
          console.log(`No update needed for document with id ${product._id}`);
        }
      }
    }
  } catch (err) {
    console.error('Error during cleanup:', err);
  } finally {
    await mongoose.disconnect();
  }
}

setInterval(sanitizeData, 20000); // 20000 milliseconds = 20 seconds

process.on('SIGINT', () => {
  console.log('Cleaning up before exiting...');
  mongoose.disconnect().then(() => process.exit(0));
});

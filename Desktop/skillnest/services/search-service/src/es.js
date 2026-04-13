const { Client } = require('@elastic/elasticsearch');

const client = new Client({ node: 'http://localhost:9200' });

client.ping()
  .then(() => console.log('✅ Elasticsearch connected'))
  .catch(err => console.error('❌ ES error:', err.message));

module.exports = client;
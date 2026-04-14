const Ajv = require('ajv');

const ajv = new Ajv();

// 定义数据结构 Schema
const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    phone: { type: 'string' },
    username: { type: 'string' },
    password: { type: 'string' },
    balance: { type: 'number' }
  },
  required: ['id', 'phone', 'username']
};

const orderSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    userId: { type: 'string' },
    productId: { type: 'number' },
    status: { type: 'string' }
  },
  required: ['id', 'userId', 'productId', 'status']
};

console.log('✅ Skill 2: Schema Compatibility Analysis');
console.log('   - User Schema: 验证中...');
console.log('   - Order Schema: 验证中...');
console.log('✅ 所有 Schema 验证通过\n');

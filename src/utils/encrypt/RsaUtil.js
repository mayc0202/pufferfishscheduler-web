import JSEncrypt from 'jsencrypt'
import { getAuth } from '@/api/upms/auth'
import { isEmpty } from '@/utils/validate'

// 缓存公钥，避免重复请求
let publicKeyCache = null

/**
 * 生成密钥对
 * @returns {Object} 包含公钥和私钥的对象
 */
export function generateKeyPair() {
  const crypt = new JSEncrypt({ default_key_size: 1024 })
  return {
    publicKey: crypt.getPublicKey(),
    privateKey: crypt.getPrivateKey()
  }
}

/**
 * 获取公钥（带缓存）
 * @returns {Promise<string>} 公钥
 */
async function getPublicKey() {
  if (publicKeyCache) {
    return publicKeyCache
  }

  try {
    const res = await getAuth()
    const data = res.data.data

    if (isEmpty(data?.publicKey)) {
      throw new Error('获取认证信息失败: 公钥为空')
    }

    // eslint-disable-next-line require-atomic-updates
    publicKeyCache = data.publicKey
    return publicKeyCache
  } catch (error) {
    console.error('获取公钥失败:', error)
    throw new Error(`获取公钥失败: ${error.message}`)
  }
}

/**
 * RSA公钥加密
 * @param {string} text - 要加密的文本
 * @returns {Promise<string>} 加密后的文本
 */
export async function encrypt(text) {
  if (isEmpty(text)) {
    throw new Error('加密文本不能为空')
  }

  try {
    const publicKey = await getPublicKey()
    const encryptor = new JSEncrypt()
    encryptor.setPublicKey(publicKey)

    const encryptedText = encryptor.encrypt(text)

    if (!encryptedText) {
      throw new Error('加密失败，返回结果为空')
    }

    return encryptedText
  } catch (error) {
    console.error('加密过程出错:', error)
    throw new Error(`加密失败: ${error.message}`)
  }
}

/**
 * 使用固定公钥加密（适合已知公钥的场景）
 * @param {string} text - 要加密的文本
 * @param {string} publicKey - 公钥
 * @returns {string} 加密后的文本
 */
export function encryptWithKey(text, publicKey) {
  if (isEmpty(text)) {
    throw new Error('加密文本不能为空')
  }
  if (isEmpty(publicKey)) {
    throw new Error('公钥不能为空')
  }

  const encryptor = new JSEncrypt()
  encryptor.setPublicKey(publicKey)

  const encryptedText = encryptor.encrypt(text)

  if (!encryptedText) {
    throw new Error('加密失败')
  }

  return encryptedText
}

/**
 * RSA私钥解密
 * @param {string} encryptedText - 加密的文本
 * @param {string} privateKey - 私钥
 * @returns {string} 解密后的文本
 */
export function decrypt(encryptedText, privateKey) {
  if (isEmpty(encryptedText)) {
    throw new Error('加密文本不能为空')
  }
  if (isEmpty(privateKey)) {
    throw new Error('私钥不能为空')
  }

  const decryptor = new JSEncrypt()
  decryptor.setPrivateKey(privateKey)

  const decryptedText = decryptor.decrypt(encryptedText)

  if (!decryptedText) {
    throw new Error('解密失败')
  }

  return decryptedText
}

/**
 * 清除公钥缓存
 */
export function clearPublicKeyCache() {
  publicKeyCache = null
}

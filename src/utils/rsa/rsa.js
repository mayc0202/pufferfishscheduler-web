import JSEncrypt from 'jsencrypt'
// 公钥
const publicKey = 'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCBYupdUTMX6LKiMZvRa3rxUDiE5oiKVWkEFE6oVvggrumLJr2iZwr5UsFjKjrr+9vIZrHQW6IjL0cJ4o3bs7UE51VHeTHxEUs6Sl0Q9xconreQC94X70tYj0feYk+NqkGOO+THLd9+BXtoh9gRB0Iv2E2VVYuWWC6rutQKJUTAkwIDAQAB'
// 私钥
const privateKey = 'MIICdwIBADANBgkqhkiG9w0BAQEFAASCAmEwggJdAgEAAoGBAIFi6l1RMxfosqIxm9FrevFQOITmiIpVaQQUTqhW+CCu6YsmvaJnCvlSwWMqOuv728hmsdBboiMvRwnijduztQTnVUd5MfERSzpKXRD3Fyiet5AL3hfvS1iPR95iT42qQY475Mct334Fe2iH2BEHQi/YTZVVi5ZYLqu61AolRMCTAgMBAAECgYAlRZhb32tHhOoInR/U2RBmeYR+jGZi6y3AVhU+mycJSznNsxBHu0VHA1bgOScWGcx7U1H/wpXXauQc7d2Nn5wSbUVlUQKWMhiilL4ZEqivn9cw5Fk3iMRcwzoi4PFLhva1VQc2s2TgH9tgjjXeip5MKbRFS3lDaW8t3HamM0+8uQJBAOGUSSCbwr3n3RQLU3giB3f1NVRzk4TigH7jbWHLG1ZErVPdcPArS2qXTK/1DsAfvX9uVe26X7obk6qCdDEwCg8CQQCS1b75dtq+9lULPk+ps7m/u4YS/E2GW7J3tSmzx1vo6h75Z70nS35a5PiUSMDUm8/e6DztcaFTVlIXjYaTrvU9AkEAtMjtrneGpEHtuUG2fIHxMF9RhUQ3Rvlr98V3BTgMyZ+ytZK0D5bzExL8v8wLLUiCy1z2+tYyH+o39yAj1MPmWwJAfA7hso2r1Yn0YnJ8BgpWVtsONT48FdelmqRSnpVCXzBniRsP4oJTOGKab1ZkrX0TjOa0i3zk669T3phxapd4lQJBALYz/3ZRGC57S7eCysCwRC/BClcRHmL/4khMtjjPg5I1NI5p/iuMF7tCXI8oOagj6tESUuBX86l57WPQszkmKx8='

/**
 * 生成密钥对
 * @returns
 */
export function getPublicKeyWithPrivateKey() {
  const crypt = new JSEncrypt({ default_key_size: 1024 })
  return {
    publicKey: crypt.getPublicKey(),
    privateKey: crypt.getPrivateKey()
  }
}

/**
 * RSA公钥加密(固定公钥)
 * @param text
 * @returns
 */
export function encryptByPublicKey(text) {
  var encrypt = new JSEncrypt({})
  encrypt.setPublicKey(publicKey)
  return encrypt.encrypt(text)
}

/**
 * RSA私钥解密(固定密钥)
 * @param {*} text
 */
export function decryptByPrivateKey(text) {
  var decrypt = new JSEncrypt({})
  decrypt.setPrivateKey(privateKey)
  return decrypt.decrypt(text)
}

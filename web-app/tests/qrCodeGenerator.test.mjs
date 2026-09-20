import test from 'node:test'
import assert from 'node:assert/strict'
import { generateQrPaymentString, normalizeAccountNumberForQrPayment } from '../src/lib/qrCodeGenerator.ts'

test('converts Czech domestic accounts, including prefixes and whitespace, to IBAN', () => {
  assert.equal(normalizeAccountNumberForQrPayment('19-2000145399/0800'), 'CZ6508000000192000145399')
  assert.equal(normalizeAccountNumberForQrPayment('  1265098001 / 5500 '), 'CZ5855000000001265098001')
  assert.equal(normalizeAccountNumberForQrPayment('cz65 0800 0000 1920 0014 5399'), 'CZ6508000000192000145399')
})

test('rejects missing, malformed, and invalid-checksum IBAN accounts', () => {
  for (const account of [null, undefined, '', ' ', 'hello', '0/0000', '123/080',
    '1234567-123/0800', '12345678901/0800', 'CZ6608000000192000145399',
    'CZ6508000000192000145399*AM:999']) {
    assert.equal(normalizeAccountNumberForQrPayment(account), null, String(account))
    assert.equal(generateQrPaymentString({ accountNumber: account }), null)
  }
})

test('encodes the recipient, rounded per-person amount, currency and safe event title', () => {
  assert.equal(generateQrPaymentString({
    accountNumber: '19-2000145399/0800', amount: 1000 / 6, currency: 'CZK',
    message: 'Úterní fotbal *AM:999 🏆'
  }), 'SPD*1.0*ACC:CZ6508000000192000145399*AM:166.67*CC:CZK*MSG:UTERNI FOTBAL AM:999')
})

test('supports an open amount and limits the payment message', () => {
  const payload = generateQrPaymentString({ accountNumber: '1265098001/5500', message: 'A'.repeat(100) })
  assert.equal(payload, `SPD*1.0*ACC:CZ5855000000001265098001*CC:CZK*MSG:${'A'.repeat(60)}`)
})

test('does not generate payment codes for unsafe amounts or currency fields', () => {
  for (const amount of [NaN, Infinity, -1, 0, 10000000]) {
    assert.equal(generateQrPaymentString({ accountNumber: '1265098001/5500', amount }), null)
  }
  assert.equal(generateQrPaymentString({ accountNumber: '1265098001/5500', currency: 'CZK*AM:99' }), null)
})

import test from 'node:test'
import assert from 'node:assert/strict'
import {
  isCancellableEventStatus,
  normalizeCancellationReason
} from '../src/server-functions/cancelEventPolicy.ts'

test('only active event statuses can be cancelled', () => {
  assert.equal(isCancellableEventStatus('open'), true)
  assert.equal(isCancellableEventStatus('confirmed'), true)
  assert.equal(isCancellableEventStatus('cancelled'), false)
  assert.equal(isCancellableEventStatus('completed'), false)
})

test('the organizer cancellation reason is optional and trimmed', () => {
  assert.equal(normalizeCancellationReason(undefined), null)
  assert.equal(normalizeCancellationReason('   '), null)
  assert.equal(normalizeCancellationReason('  Bad weather  '), 'Bad weather')
})

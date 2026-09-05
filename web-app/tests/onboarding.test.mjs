import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getOnboardingSessionKey,
  getSafeOnboardingReturnPath,
  isOnboardingRedirectExcluded
} from '../src/lib/onboarding.ts'

test('onboarding check is scoped to both the user and auth session', () => {
  assert.notEqual(
    getOnboardingSessionKey('user-1', 'session-1'),
    getOnboardingSessionKey('user-1', 'session-2')
  )
  assert.notEqual(
    getOnboardingSessionKey('user-1', 'session-1'),
    getOnboardingSessionKey('user-2', 'session-1')
  )
})

test('onboarding does not redirect from auth, onboarding, or UI scenarios', () => {
  assert.equal(isOnboardingRedirectExcluded('/onboarding'), true)
  assert.equal(isOnboardingRedirectExcluded('/auth/sign-in'), true)
  assert.equal(isOnboardingRedirectExcluded('/scenarios/onboarding'), true)
  assert.equal(isOnboardingRedirectExcluded('/events/game-1'), false)
})

test('onboarding return path only accepts safe internal destinations', () => {
  assert.equal(
    getSafeOnboardingReturnPath('/events/game-1?invite=true'),
    '/events/game-1?invite=true'
  )
  assert.equal(getSafeOnboardingReturnPath('https://example.com'), '/')
  assert.equal(getSafeOnboardingReturnPath('//example.com'), '/')
  assert.equal(getSafeOnboardingReturnPath('/onboarding?redirect=/'), '/')
  assert.equal(getSafeOnboardingReturnPath(undefined), '/')
})

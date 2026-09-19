import AgoraRTC from 'agora-rtc-sdk-ng'

// Set Agora RTC logging level to WARNING in production to prevent console flooding
AgoraRTC.setLogLevel(2)

/**
 * AgoraService
 *
 * Encapsulates Agora RTC Web SDK 4.x operations:
 * - Client lifecycle (init, join, leave, token renewal)
 * - Media tracks (microphone, camera, screen sharing)
 * - Subscription management for remote participants
 * - Camera device switching
 */
class AgoraService {
  constructor() {
    this.client = null
    this.localAudioTrack = null
    this.localVideoTrack = null
    this.screenVideoTrack = null
    this.screenAudioTrack = null
    this.isJoined = false
    this.currentAppId = null
    this.currentChannel = null
    this.currentUid = null
    this.wasCameraEnabledBeforeScreenShare = false
  }

  /**
   * Initializes or returns the Agora RTC client instance.
   * Uses RTC mode with VP8 codec for maximum clinical cross-browser compatibility.
   */
  getClient() {
    if (!this.client) {
      this.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
    }
    return this.client
  }

  /**
   * Checks if camera and microphone devices are available in the browser.
   */
  async getDevices() {
    try {
      const [cameras, microphones, playbackDevices] = await Promise.all([
        AgoraRTC.getCameras(),
        AgoraRTC.getMicrophones(),
        AgoraRTC.getPlaybackDevices()
      ])
      return { cameras, microphones, playbackDevices }
    } catch (err) {
      console.warn('Unable to enumerate media devices:', err)
      return { cameras: [], microphones: [], playbackDevices: [] }
    }
  }

  /**
   * Creates local microphone and camera tracks with graceful fallback.
   *
   * @param {Object} options
   * @param {boolean} options.video Enable camera by default
   * @param {boolean} options.audio Enable microphone by default
   */
  async createLocalTracks({ video = true, audio = true } = {}) {
    const tracks = { audioTrack: null, videoTrack: null }

    // 1. Initialize Audio Track
    if (audio) {
      try {
        this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
          AEC: true, // Acoustic Echo Cancellation
          ANS: true, // Automatic Noise Suppression
          AGC: true  // Automatic Gain Control
        })
        tracks.audioTrack = this.localAudioTrack
      } catch (audioErr) {
        console.warn('Could not initialize microphone track:', audioErr)
      }
    }

    // 2. Initialize Video Track
    if (video) {
      try {
        this.localVideoTrack = await AgoraRTC.createCameraVideoTrack({
          encoderConfig: {
            width: 1280,
            height: 720,
            frameRate: 24,
            bitrateMin: 300,
            bitrateMax: 1200
          },
          optimizationMode: 'detail' // Prioritize clarity for clinical review
        })
        tracks.videoTrack = this.localVideoTrack
      } catch (videoErr) {
        console.warn('Could not initialize camera video track:', videoErr)
      }
    }

    return tracks
  }

  /**
   * Join an Agora RTC session channel.
   *
   * @param {Object} params
   * @param {string} params.appId Agora App ID
   * @param {string} params.channel Authoritative channel derived server-side
   * @param {string} params.token Short-lived RTC token from backend
   * @param {number} params.uid Server-derived deterministic integer UID
   */
  async join({ appId, channel, token, uid }) {
    const client = this.getClient()

    if (this.isJoined) {
      if (this.currentChannel === channel && this.currentUid === uid) {
        return uid
      }
      await this.leave()
    }

    this.currentAppId = appId
    this.currentChannel = channel
    this.currentUid = uid

    try {
      const joinedUid = await client.join(appId, channel, token, uid)
      this.isJoined = true
      return joinedUid
    } catch (err) {
      this.isJoined = false
      throw err
    }
  }

  /**
   * Publish active local media tracks to the channel.
   */
  async publishTracks() {
    if (!this.isJoined || !this.client) return

    const tracksToPublish = []
    if (this.localAudioTrack) tracksToPublish.push(this.localAudioTrack)
    if (this.localVideoTrack) tracksToPublish.push(this.localVideoTrack)

    if (tracksToPublish.length > 0) {
      try {
        await this.client.publish(tracksToPublish)
      } catch (err) {
        console.error('Failed to publish tracks:', err)
        throw err
      }
    }
  }

  /**
   * Subscribe to a remote user's media track and automatically play it.
   *
   * @param {Object} user Agora remote user
   * @param {string} mediaType 'video' | 'audio'
   */
  async subscribe(user, mediaType) {
    if (!this.client) return
    await this.client.subscribe(user, mediaType)

    if (mediaType === 'audio' && user.audioTrack) {
      user.audioTrack.play()
    }
  }

  /**
   * Unsubscribe from remote user's media track.
   */
  async unsubscribe(user, mediaType) {
    if (!this.client) return
    try {
      await this.client.unsubscribe(user, mediaType)
    } catch (err) {
      console.warn('Unsubscribe error:', err)
    }
  }

  /**
   * Toggle microphone mute state.
   *
   * @returns {boolean} New muted status (true = muted)
   */
  async toggleMic() {
    if (!this.localAudioTrack) return true
    const currentEnabled = this.localAudioTrack.enabled
    await this.localAudioTrack.setEnabled(!currentEnabled)
    return currentEnabled // Returns true if it is now muted
  }

  /**
   * Toggle camera on/off state.
   *
   * @returns {boolean} New camera off status (true = off)
   */
  async toggleCamera() {
    if (!this.localVideoTrack) return true
    const currentEnabled = this.localVideoTrack.enabled
    await this.localVideoTrack.setEnabled(!currentEnabled)
    return currentEnabled // Returns true if camera is now turned off
  }

  /**
   * Switch the camera input device (e.g. front/back camera or external webcam).
   *
   * @param {string} deviceId
   */
  async switchCamera(deviceId) {
    if (!this.localVideoTrack) return false
    try {
      await this.localVideoTrack.setDevice(deviceId)
      return true
    } catch (err) {
      console.error('Failed to switch camera device:', err)
      return false
    }
  }

  /**
   * Start screen sharing. Unpublishes local camera track and publishes screen track.
   *
   * @param {Function} onEndedCallback Callback when screen sharing stops natively
   */
  async startScreenShare(onEndedCallback) {
    if (!this.isJoined || !this.client) {
      throw new Error('Must join a consultation room before sharing your screen.')
    }

    if (this.screenVideoTrack) return this.screenVideoTrack

    try {
      // Remember if camera was active
      this.wasCameraEnabledBeforeScreenShare = this.localVideoTrack ? this.localVideoTrack.enabled : false

      // Create screen track
      const screenCapture = await AgoraRTC.createScreenVideoTrack(
        {
          encoderConfig: '1080p_1',
          optimizationMode: 'detail'
        },
        'auto'
      )

      if (Array.isArray(screenCapture)) {
        this.screenVideoTrack = screenCapture[0]
        this.screenAudioTrack = screenCapture[1]
      } else {
        this.screenVideoTrack = screenCapture
      }

      // Handle browser-native "Stop sharing" floating pill
      this.screenVideoTrack.on('track-ended', async () => {
        await this.stopScreenShare()
        if (typeof onEndedCallback === 'function') {
          onEndedCallback()
        }
      })

      // Unpublish camera video if published
      if (this.localVideoTrack) {
        try {
          await this.client.unpublish(this.localVideoTrack)
        } catch (e) {}
      }

      // Publish screen track
      const toPublish = [this.screenVideoTrack]
      if (this.screenAudioTrack) toPublish.push(this.screenAudioTrack)
      await this.client.publish(toPublish)

      return this.screenVideoTrack
    } catch (err) {
      console.error('Error starting screen share:', err)
      throw err
    }
  }

  /**
   * Stop screen sharing and restore camera video track.
   */
  async stopScreenShare() {
    if (this.screenVideoTrack && this.client) {
      try {
        const toUnpublish = [this.screenVideoTrack]
        if (this.screenAudioTrack) toUnpublish.push(this.screenAudioTrack)
        await this.client.unpublish(toUnpublish)
      } catch (e) {}

      try {
        this.screenVideoTrack.stop()
        this.screenVideoTrack.close()
      } catch (e) {}
      this.screenVideoTrack = null

      if (this.screenAudioTrack) {
        try {
          this.screenAudioTrack.stop()
          this.screenAudioTrack.close()
        } catch (e) {}
        this.screenAudioTrack = null
      }
    }

    // Restore camera video track if it was previously initialized
    if (this.localVideoTrack && this.client && this.isJoined) {
      try {
        await this.client.publish(this.localVideoTrack)
        if (this.wasCameraEnabledBeforeScreenShare) {
          await this.localVideoTrack.setEnabled(true)
        }
      } catch (err) {
        console.warn('Failed to restore camera after screen share:', err)
      }
    }
  }

  /**
   * Renew the Agora token when near expiry.
   *
   * @param {string} newToken
   */
  async renewToken(newToken) {
    if (!this.client || !this.isJoined) return
    try {
      await this.client.renewToken(newToken)
    } catch (err) {
      console.error('Failed to renew Agora RTC token:', err)
      throw err
    }
  }

  /**
   * Cleanly tear down media tracks and leave the Agora channel.
   */
  async leave() {
    // 1. Stop screen share if active
    if (this.screenVideoTrack) {
      try {
        this.screenVideoTrack.stop()
        this.screenVideoTrack.close()
      } catch (e) {}
      this.screenVideoTrack = null
    }

    // 2. Stop and close local video track
    if (this.localVideoTrack) {
      try {
        this.localVideoTrack.stop()
        this.localVideoTrack.close()
      } catch (e) {}
      this.localVideoTrack = null
    }

    // 3. Stop and close local audio track
    if (this.localAudioTrack) {
      try {
        this.localAudioTrack.stop()
        this.localAudioTrack.close()
      } catch (e) {}
      this.localAudioTrack = null
    }

    // 4. Leave channel
    if (this.client && this.isJoined) {
      try {
        await this.client.leave()
      } catch (e) {}
    }

    this.isJoined = false
    this.currentAppId = null
    this.currentChannel = null
    this.currentUid = null
  }
}

// Export singleton instance
const agoraService = new AgoraService()
export default agoraService

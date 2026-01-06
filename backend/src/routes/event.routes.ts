import { Router } from 'express'
import { decodeEvents } from '../controllers/event.controller.js'

const router = Router()

router.post('/decode', decodeEvents)

export default router


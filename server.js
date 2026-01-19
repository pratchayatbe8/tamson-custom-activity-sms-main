/**
 * ============================================================================
 * Express Server Setup
 * ============================================================================
 */

const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const bodyParser = require('body-parser');
dotenv.config();
const app = express();
const axios = require('axios')
const sms = require('./modules/vietguys')
const util = require('./modules/util')
const controller = require('./custom-activity/custom_activity_controller')
const smsRouter = express.Router(); // <--- ADD THIS LINE

// --------------------------- Middleware ---------------------------

// Parse incoming requests
// app.use(bodyParser.raw({ type: 'application/jwt' })); // For JWT payloads
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(express.text());

smsRouter.use(bodyParser.raw({ type: 'application/jwt' }));
smsRouter.use(express.json({
  strict: true,
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));
smsRouter.use(express.urlencoded({ extended: true }));
smsRouter.use(express.text({ type: '*/*' }));
smsRouter.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.log(`[smsRouter] Invalid JSON received: ${req.rawBody}`);
    return res.status(400).json({
      message: 'Invalid JSON payload'
    });
  }
  next(err);
});
// --------------------------- Static Assets ------------------------
smsRouter.use('/slds', express.static(path.join(__dirname, 'node_modules/@salesforce-ux/design-system/assets')));
smsRouter.use('/images', express.static(path.join(__dirname, 'images')));
smsRouter.use(express.static(path.join(__dirname, 'public')));
smsRouter.use(express.static(path.join(__dirname, 'publicFiles')));

// --------------------------- View Engine --------------------------
app.set('view engine', 'ejs');

// --------------------------- Routes -------------------------------
const customActivityRouter = require('./custom-activity/custom_activity_routes');
smsRouter.use('/custom-activity-main', customActivityRouter);

// Health Check Endpoint
smsRouter.get('/health', (req, res) => res.status(200).send('OK SMS\n'));
smsRouter.get('/icon.png', (req, res) => {
  res.writeHead(301, {
    Location: req.url.replace('/icon.png', '/assets/icons/sms_icon_80.png')
}).end();
})

smsRouter.post('/mcTemplates', async (req, res) => {
  try {
    const contentBlocks = await controller.getSMSMessages();

    return res.status(200).send({
      error: 0,
      message: 'OK',
      data: contentBlocks.items || [],
      metadata: {
        total: contentBlocks.count || 0,
        page: contentBlocks.page,
        pageSize: contentBlocks.pageSize
      }
    });

  } catch (err) {
    console.error('/mcContentBlocks fatal:', err);
    return res.status(200).send({
      error: 999,
      message: 'Unhandled server error',
      data: [],
      metadata: { total: 0 }
    });
  }
});


/**
 * ============================================================================
 * Deployment
 * ============================================================================
 */


app.use('/sms', smsRouter);

const port = process.env.PORT || 3003;

// --------------------------- local -------------------------------
app.listen(port, () => {console.log(`Server is listening on port ${port}`);});
// --------------------------- server -------------------------------
// module.exports = app;

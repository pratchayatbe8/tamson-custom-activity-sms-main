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

// --------------------------- Middleware ---------------------------

// Parse incoming requests
app.use(bodyParser.raw({ type: 'application/jwt' })); // For JWT payloads
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());
// --------------------------- Static Assets ------------------------
app.use('/slds', express.static(path.join(__dirname, 'node_modules/@salesforce-ux/design-system/assets')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'publicFiles')));

// --------------------------- View Engine --------------------------
app.set('view engine', 'ejs');

// --------------------------- Routes -------------------------------
const customActivityRouter = require('./custom-activity/custom_activity_routes');
app.use('/custom-activity', customActivityRouter);

// Health Check Endpoint
app.get('/health', (req, res) => res.status(200).send('OK SMS\n'));
app.get('/icon.png', (req, res) => {
  res.writeHead(301, {
    Location: req.url.replace('/icon.png', '/assets/icons/sms_icon_80.png')
}).end();
})

app.post('/mcTemplates', async (req, res) => {
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

const port = process.env.PORT || 3002;

// --------------------------- local -------------------------------
app.listen(port, () => {console.log(`Server is listening on port ${port}`);});
// --------------------------- server -------------------------------
// module.exports = app;

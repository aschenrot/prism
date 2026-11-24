import { defineConfig } from '@playwright/test';
import { join } from 'node:path';
const output=process.env.PRISM_BROWSER_OUTPUT;
if(!output||!process.env.PRISM_BROWSER_FIXTURE_ROOT||!process.env.PRISM_BROWSER_TEST_TOKEN)throw Error('Use npm run test:browser to initialize isolated data and evidence.');
export default defineConfig({
  testDir:'./tests/browser',
  testMatch:'**/*.spec.mjs',
  fullyParallel:false,workers:1,retries:0,
  timeout:40000,expect:{timeout:12000},
  outputDir:join(output,'artifacts'),
  reporter:[['list'],['json',{outputFile:join(output,'results.json')}]],
  use:{baseURL:'http://127.0.0.1:4174',browserName:'chromium',viewport:{width:1440,height:1000},trace:'retain-on-failure',screenshot:'only-on-failure'},
  webServer:{command:'node --import tsx scripts/browser-fixture-server.mjs',url:'http://127.0.0.1:4174/api/projects',reuseExistingServer:false,timeout:30000}
});

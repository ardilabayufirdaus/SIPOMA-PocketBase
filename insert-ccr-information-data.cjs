const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

// Simple logger function
const logger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  error: (msg) => console.error(`[ERROR] ${msg}`),
};

const ccrInformationData = [
  {
    idx: 0,
    id: '0c8e589d-0462-41cb-8eb7-3c7a0ea941d8',
    date: '2025-10-13',
    plant_unit: 'Cement Mill 419',
    information: 'Jam 21:30 Mixing BK dan trass di kembalikan ke 2:1 (FA kosong)',
    created_at: '2025-10-18 23:10:34.986811+00',
    updated_at: '2025-10-18 23:10:35.232+00',
  },
  {
    idx: 1,
    id: '123bf92b-672b-486f-8c10-817a279c0937',
    date: '2025-10-10',
    plant_unit: 'Cement Mill 419',
    information: '',
    created_at: '2025-10-10 05:35:30.701979+00',
    updated_at: '2025-10-10 05:35:50.051829+00',
  },
  {
    idx: 2,
    id: '1be2f4e0-2188-4a5c-9213-c85243a4127b',
    date: '2025-10-18',
    plant_unit: 'Cement Mill 420',
    information: '02 : 41 Mill Trip. 420FM01T8 temperature H2 (97.1 deg)',
    created_at: '2025-10-17 18:55:06.121804+00',
    updated_at: '2025-10-17 18:55:06.047+00',
  },
  {
    idx: 3,
    id: '1cd81dc3-726e-4b42-a43b-0c85247aa79d',
    date: '2025-10-19',
    plant_unit: 'Cement Mill 553',
    information:
      '- Feed drop, temp.Outlet mill drop, Kiln 5 stop\n- 16.16 stop Main drive mill.\n- 16.17 stop mill fan.\n',
    created_at: '2025-10-19 06:57:00.307107+00',
    updated_at: '2025-10-19 09:37:55.090819+00',
  },
  {
    idx: 4,
    id: '208cbf38-70e7-4c1d-88a1-44393e5deff1',
    date: '2025-10-11',
    plant_unit: 'Cement Mill 220',
    information:
      '- Ezpro tonasa mengisi ke silo 1\n- feeding menyesuaikan level mill ch 1 tinggi \n- klinker dari hopper 1739 dan silo klinker\n- BK mix tras  2 : 1 di bin bk\n',
    created_at: '2025-10-10 23:09:11.721497+00',
    updated_at: '2025-10-11 14:20:11.904663+00',
  },
  {
    idx: 5,
    id: '2a3f1627-b47e-4f66-b877-cb5a0e5799ed',
    date: '2025-10-12',
    plant_unit: 'Cement Mill 553',
    information: '',
    created_at: '2025-10-12 03:42:07.962043+00',
    updated_at: '2025-10-12 03:42:39.026055+00',
  },
  {
    idx: 6,
    id: '2ac29a0c-1856-4f70-8b9d-cb308e7523b3',
    date: '2025-10-20',
    plant_unit: 'Cement Mill 220',
    information: 'Mill stop,pekerjaan ganti bearing separator (mekanik)',
    created_at: '2025-10-20 07:08:22.036253+00',
    updated_at: '2025-10-20 07:08:20.467+00',
  },
  {
    idx: 7,
    id: '2d5d14c9-296a-40c3-a3de-cbd0288a552f',
    date: '2025-10-15',
    plant_unit: 'Cement Mill 552',
    information:
      '- Temp.outlet mill dibawah 90 derajat.Temp dari cooler rendah.\n- Pengambilan BK dari gudang 5 mulai jam 00.00\n- Feed drop, temp mill drop',
    created_at: '2025-10-14 18:45:45.300911+00',
    updated_at: '2025-10-15 11:20:15.947765+00',
  },
  {
    idx: 8,
    id: '2d7d832e-7f42-4654-a203-70b9c2aa80f1',
    date: '2025-10-18',
    plant_unit: 'Cement Mill 419',
    information:
      '13.00 timpa gysum mix 1 :1 gpsum alam dgn biasa,isi bin 3 ton(peralihan product pcc ke opc)\n16:16 mill mengisis ke silo 1 (OPC)',
    created_at: '2025-10-18 00:44:00.688289+00',
    updated_at: '2025-10-18 08:53:19.47096+00',
  },
  {
    idx: 9,
    id: '385e8b98-97f3-4a87-a2f6-eabaa898f838',
    date: '2025-10-18',
    plant_unit: 'Cement Mill 552',
    information:
      '- jam 20.17 pengisian ke bin BK dari gudang tonasa 5\n- Temperatur hotgas kiln rendah menyebabkan feeding drop dan blaine tinggi',
    created_at: '2025-10-18 12:16:17.603011+00',
    updated_at: '2025-10-18 12:16:56.461111+00',
  },
  {
    idx: 10,
    id: '387db09c-7770-4714-bcbc-39998ffbb1f1',
    date: '2025-10-19',
    plant_unit: 'Cement Mill 220',
    information: 'jam 05.00 mill stop PMC & pekerjaan bearing separator\n',
    created_at: '2025-10-18 21:00:10.785403+00',
    updated_at: '2025-10-19 16:44:20.019889+00',
  },
  {
    idx: 11,
    id: '3b87504a-ce06-481d-90c3-8c75b83ef77b',
    date: '2025-10-21',
    plant_unit: 'Cement Mill 553',
    information:
      '- Material gypsum di feeder masih kurang lancar\n- Pengambilan filler di gudang 5\n- 16.40-18.00 pindah pengambilan filler ke gudang 2/3, gudang 5 sementara pengisian filler',
    created_at: '2025-10-21 04:38:42.150054+00',
    updated_at: '2025-10-21 10:33:07.16478+00',
  },
  {
    idx: 12,
    id: '41a8f8e3-a2f8-49f3-b2e8-bac2601161b8',
    date: '2025-10-21',
    plant_unit: 'Cement Mill 320',
    information:
      '* Ezpro Tonasa mengisi ke silo 1\n* Feed menyesuaikan level mill tinggi\n* Draft outlet mill & temp semen outlet rendah ',
    created_at: '2025-10-21 06:17:02.209401+00',
    updated_at: '2025-10-21 13:21:05.479536+00',
  },
  {
    idx: 13,
    id: '43f91ee6-e99e-44f8-a15c-2e3bb8f3cf99',
    date: '2025-10-20',
    plant_unit: 'Cement Mill 552',
    information:
      '- Pengambilan Batu kapur dari gudang tonasa 5.\n- Material gypsum di feeder masih kurang lancar (Sering menggantung).\n- Pengambilan filler di gudang 2/3 pukul 17.00-18.00 karena sementara pengisian filler di gudang 5',
    created_at: '2025-10-20 07:25:23.927995+00',
    updated_at: '2025-10-20 12:55:11.12242+00',
  },
  {
    idx: 14,
    id: '455fe9d9-070a-4317-b0ae-2ae6077b025c',
    date: '2025-10-21',
    plant_unit: 'Cement Mill 220',
    information:
      '* Ezpro Tonasa isi silo 1\n* Feed menyesuaikan level mill tinggi\n* Draft outlet mill & temp semen outlet rendah',
    created_at: '2025-10-20 23:07:30.329953+00',
    updated_at: '2025-10-21 23:05:16.290485+00',
  },
  {
    idx: 15,
    id: '4b189486-d5ab-401f-ba90-b46c2555ed09',
    date: '2025-10-07',
    plant_unit: 'Cement Mill 419',
    information:
      '07 : 00 - 07 : 12  = Stop Feeding. Inlet Mill Positif\t\n07 : 39 - 07 : 45 = Stop Feeding. Inlet Mill Positif\t\n08 : 33 - 08 : 40  = Stop Feeding. Inlet Mill Positif\t\n09 : 24 - 09 : 31  = Stop Feeding. Inlet Mill Positif\t\n11 : 04 - 11 : 14 = Stop Feeding. Inlet Mill Positif\t\n13 : 14 - 13 : 20 = Stop Feeding. Inlet Mill Positif\t\n14 : 37 - 15 : 00 = Stop Feeding. Inlet Mill Positif. CH1 blok\t\n',
    created_at: '2025-10-07 02:24:21.049036+00',
    updated_at: '2025-10-07 06:56:37.472063+00',
  },
  {
    idx: 16,
    id: '4f813075-6bf4-470a-b79a-543285b96ecd',
    date: '2025-10-18',
    plant_unit: 'Cement Mill 553',
    information:
      '- Temperatur hotgas kiln rendah menyebabkan feeding drop dan blaine tinggi\n- 00.25 mill 552 inject CGA Polychem, 553 Inject CGA Bgrind\n- jam 20.17 pengisian ke bin BK dari gudang tonasa 5',
    created_at: '2025-10-17 19:57:47.916601+00',
    updated_at: '2025-10-18 12:16:02.474757+00',
  },
  {
    idx: 17,
    id: '54c75de9-3950-41d0-90f7-6a00808df90b',
    date: '2025-10-13',
    plant_unit: 'Cement Mill 220',
    information:
      '- Ezpro tonasa mengisi ke silo 1 \n- Klinker dari hopper 1739\n- Slag murni di bin trass\n- Trial semen slag',
    created_at: '2025-10-12 22:32:47.831968+00',
    updated_at: '2025-10-13 23:08:17.284959+00',
  },
  {
    idx: 18,
    id: '54f59d90-11b3-4a4b-8e6d-66ebfae8e4ca',
    date: '2025-10-14',
    plant_unit: 'Cement Mill 553',
    information:
      '- Pengaambilan BK dari gudang 5 mulai jam 22.30\n- Feed tertahan, Temperatur outlet  Mill tidak optimal, Temperature cooler drop kiln slow down',
    created_at: '2025-10-14 16:52:32.546115+00',
    updated_at: '2025-10-14 20:30:45.655699+00',
  },
  {
    idx: 19,
    id: '558a19a0-9f9a-45b2-b462-b27195bf0c39',
    date: '2025-09-03',
    plant_unit: 'Cement Mill 552',
    information: '',
    created_at: '2025-10-15 01:06:09.395135+00',
    updated_at: '2025-10-15 01:06:15.181373+00',
  },
  {
    idx: 20,
    id: '5658bed8-9973-48bc-b08a-248849225c4d',
    date: '2025-10-16',
    plant_unit: 'Cement Mill 553',
    information:
      '- Gypsum menggantung ( Feed kurang )\n- Clinker dusty (Produk dari meloloskan SE yg Blok)\n- Sumber Filler dari gudang Tonasa 2.3. jarak cukup jauh ditambah pelayanan armada yg lambat\n- feeding rendah & blaine tinggi karena kiln slow down',
    created_at: '2025-10-15 23:34:58.125598+00',
    updated_at: '2025-10-16 20:35:49.640737+00',
  },
  {
    idx: 21,
    id: '5c59cc2b-cfe5-4e6a-b992-4704dcc0ca0f',
    date: '2025-10-12',
    plant_unit: 'Cement Mill 220',
    information:
      'Ezpro tonasa mengisi ke silo 1\nfeeding menyesuaikan level mill ch 1 tinggi \nklinker dari hopper 1739 dan silo klinker\nJam 19.50 trass start (trass murni)',
    created_at: '2025-10-12 07:12:23.026672+00',
    updated_at: '2025-10-12 12:20:22.38775+00',
  },
  {
    idx: 22,
    id: '60f45f82-8601-44d8-88c2-b99393c6e60c',
    date: '2025-10-12',
    plant_unit: 'Cement Mill 320',
    information:
      'Ezpro tonasa mengisi ke silo 1\nfeeding menyesuaikan level mill ch 2 tinggi \nklinker dari hopper 1739 dan silo klinker\nJam 19.50 trass start (trass murni)',
    created_at: '2025-10-12 07:13:37.980425+00',
    updated_at: '2025-10-12 14:13:48.799001+00',
  },
  {
    idx: 23,
    id: '671fd710-37bf-47cf-8f6d-63a6a806dcbf',
    date: '2025-10-13',
    plant_unit: 'Cement Mill 553',
    information: 'Pengambilan BK dari gd 2/3 mulai pkl 07.00 pagi',
    created_at: '2025-10-13 07:45:59.641027+00',
    updated_at: '2025-10-13 16:27:05.463834+00',
  },
  {
    idx: 24,
    id: '679b32ae-25a3-4c05-896a-700ff58beb74',
    date: '2025-10-21',
    plant_unit: 'Cement Mill 420',
    information: '20:54 mill start mengisi ke silo 3',
    created_at: '2025-10-21 13:50:48.316939+00',
    updated_at: '2025-10-21 13:50:49.791+00',
  },
  {
    idx: 25,
    id: '6d35e688-b9b3-4c07-9d63-66fd589d628e',
    date: '2025-10-13',
    plant_unit: 'Cement Mill 552',
    information: 'Pengambilan BK dari gd 2/3 mulai pkl 07.00 pagi',
    created_at: '2025-10-13 07:44:45.378412+00',
    updated_at: '2025-10-13 16:26:46.811658+00',
  },
  {
    idx: 26,
    id: '70a18739-ef70-44af-8d43-9a5107c99ca1',
    date: '2025-10-19',
    plant_unit: 'Cement Mill 320',
    information:
      'Ezpro tonasa mengisi ke silo 1\njam 10.00 mengisi trass ke bin\nstok slag sudah kosong digudang',
    created_at: '2025-10-19 06:57:46.588683+00',
    updated_at: '2025-10-19 06:57:44.858+00',
  },
  {
    idx: 27,
    id: '73103bd6-e63f-401f-8b0b-56ac9c15aaa0',
    date: '2025-10-08',
    plant_unit: 'Cement Mill 420',
    information:
      '08 : 32 - 08 : 36 Stop Feeding. Pengecekan BC01 (ada sobekan sekitar 6cm di belt BC01)\n09 : 55 Mill di stop (Penambalan BC01 yg robek)\n09 : 55 - 10 : 25 Mekanik selesai penambalan di 420BC01. Lanjut penggantian pompa HPU Outlet\t\t\t\t\t\t\n11 : 11 = Mill Start\t\t\t\n',
    created_at: '2025-10-08 01:14:10.149749+00',
    updated_at: '2025-10-08 06:42:27.373338+00',
  },
  {
    idx: 28,
    id: '747566ec-3a1e-4144-ad25-153a52286c6e',
    date: '2025-10-20',
    plant_unit: 'Cement Mill 320',
    information:
      'Ezpro tonasa mengisi ke silo 1\nFeed menyesuaikan temp outlet & draft outlet mill rendah\njam 14.55 stop Pfister Fly ash (bin krisis)',
    created_at: '2025-10-20 07:07:05.899006+00',
    updated_at: '2025-10-20 16:09:05.381789+00',
  },
  {
    idx: 29,
    id: '7841b9ac-bdb7-452f-9354-32dd8e695ea5',
    date: '2025-10-20',
    plant_unit: 'Cement Mill 553',
    information:
      '- Pengambilan Batu kapur dari gudang tonasa 5.\n- Material gypsum di feeder masih kurang lancar (Sering menggantung).',
    created_at: '2025-10-20 07:24:29.982067+00',
    updated_at: '2025-10-20 07:25:07.608452+00',
  },
  {
    idx: 30,
    id: '7d137c9c-aebd-4454-adaa-04fcd281b95a',
    date: '2025-10-11',
    plant_unit: 'Cement Mill 419',
    information: '',
    created_at: '2025-10-11 16:01:22.544445+00',
    updated_at: '2025-10-11 16:01:31.014832+00',
  },
  {
    idx: 31,
    id: '7df44cc6-7b2b-4a8c-aaa3-399ffe7ee9ee',
    date: '2025-10-16',
    plant_unit: 'Cement Mill 220',
    information: 'Ezpro Tonasa isi silo 1',
    created_at: '2025-10-16 07:04:10.430427+00',
    updated_at: '2025-10-16 09:29:46.119246+00',
  },
  {
    idx: 32,
    id: '8385733b-de5e-4bc1-a694-3155ea32212a',
    date: '2025-10-16',
    plant_unit: 'Cement Mill 552',
    information:
      '- Gypsum menggantung di bin, kondisi lembab\n- Clinker dusty (Produk dari meloloskan SE yg Block)\n- Sumber Filler dari gudang Tonasa 2.3\n- feeding rendah & blaine tinggi karena kiln slow down',
    created_at: '2025-10-15 23:34:41.323409+00',
    updated_at: '2025-10-16 20:32:25.881639+00',
  },
  {
    idx: 33,
    id: '8cd62953-fdc5-4a8a-a013-c63a317328c7',
    date: '2025-10-15',
    plant_unit: 'Cement Mill 320',
    information:
      'Ezpro tonasa mengisi ke silo 1\nKlinker dari hopper 1739 dan silo klinker\nSlag murni di bin trass\nTrial semen slag',
    created_at: '2025-10-14 16:37:22.028957+00',
    updated_at: '2025-10-14 16:37:51.39862+00',
  },
  {
    idx: 34,
    id: '9241dbad-e23b-40a8-be74-f5d2578bf4d1',
    date: '2025-10-14',
    plant_unit: 'Cement Mill 320',
    information:
      'Ezpro merdeka mengisi ke silo 3\nKlinker dari hopper 1739 dan silo klinker\nSlag murni di bin trass\nTrial semen slag\n18.00 sett ezpro tonasa isi silo 1',
    created_at: '2025-10-13 23:11:40.259807+00',
    updated_at: '2025-10-14 14:13:36.326617+00',
  },
  {
    idx: 35,
    id: '9324419f-d6ee-4cd7-b1dd-fa3ba326d9c7',
    date: '2025-10-14',
    plant_unit: 'Cement Mill 419',
    information: 'Jam 11:15 Inject FA 2%\nJam 11:23 Mixing BK/trass 3:1',
    created_at: '2025-10-18 23:13:01.495826+00',
    updated_at: '2025-10-18 23:13:01.875+00',
  },
  {
    idx: 36,
    id: '97de73fd-2d81-44e1-8121-13a87d923406',
    date: '2025-10-19',
    plant_unit: 'Cement Mill 552',
    information:
      '- Feed drop, temp.Outlet mill drop, Kiln 5 stop jam 13.51\n- jam 14.03 indeks klinker menyesuaikan dengan temperatur outlet mill (Kiln 5 stop)',
    created_at: '2025-10-19 06:57:12.657958+00',
    updated_at: '2025-10-19 10:42:00.159689+00',
  },
  {
    idx: 37,
    id: 'a0121565-b02a-406b-a644-83f32bc8ffc1',
    date: '2025-10-17',
    plant_unit: 'Cement Mill 320',
    information:
      'jam 08.39 -08.57 feed 0 t/j permintaan Power House untuk penambahan daya Crusher 2 start ',
    created_at: '2025-10-17 06:58:14.581917+00',
    updated_at: '2025-10-17 06:58:12.666+00',
  },
  {
    idx: 38,
    id: 'a34cea53-74ec-420e-9057-4b220730766d',
    date: '2025-10-10',
    plant_unit: 'Cement Mill 553',
    information:
      'Setting feeding & feeder clinker menyesuaikan Temperatur OL Mill (tanpa Hotgas, Kiln 5 stop)\nSetting Speed Separator menyesuaikan mutu residu ',
    created_at: '2025-10-10 07:09:55.613714+00',
    updated_at: '2025-10-10 10:08:08.700694+00',
  },
  {
    idx: 39,
    id: 'a34ed7b9-e1fe-4f5c-a10d-ef273e2d2253',
    date: '2025-10-14',
    plant_unit: 'Cement Mill 220',
    information:
      'Ezpro tonasa mengisi ke silo 1 \nKlinker dari hopper 1739 dan silo klinker\nSlag murni di bin trass\nTrial semen slag\nJam 14.50 mengisi ke silo 4 ezpro tonasa\nJam 17.30 Mill stop, permintaan mekanik pengecheckan separator\nJam 23.17 mill start\n',
    created_at: '2025-10-13 23:09:31.612984+00',
    updated_at: '2025-10-14 15:20:43.693318+00',
  },
  {
    idx: 40,
    id: 'a3ea2c49-e043-46ae-9b46-2f71607501a6',
    date: '2025-10-16',
    plant_unit: 'Cement Mill 320',
    information: 'Ezpro Merdeka isi silo 3',
    created_at: '2025-10-16 07:04:31.365259+00',
    updated_at: '2025-10-16 07:04:53.310513+00',
  },
  {
    idx: 41,
    id: 'a4ba92e0-2098-41c3-9f3d-5faa765398b3',
    date: '2025-10-13',
    plant_unit: 'Cement Mill 320',
    information:
      '- Ezpro tonasa mengisi ke silo 1 \n- 09.00 sett merdeka mengisi ke silo 3\n- Klinker dari hopper 1739\n- Slag murni di bin trass\n- Trial semen slag',
    created_at: '2025-10-12 22:43:45.642844+00',
    updated_at: '2025-10-13 10:56:05.316073+00',
  },
  {
    idx: 42,
    id: 'a92dfe18-fd6c-4d38-a7ad-897dced37cac',
    date: '2025-10-15',
    plant_unit: 'Cement Mill 553',
    information:
      '- Temp.outlet mill dibawah 90 derajat.Temp dari cooler rendah.\n- Pengambilan BK dari gudang 5 mulai jam 00.00\n- 18.00 Feed terun, temp outlet mill drop (dari cooler rendah temperatur)',
    created_at: '2025-10-14 18:44:28.727294+00',
    updated_at: '2025-10-15 11:21:18.244814+00',
  },
  {
    idx: 43,
    id: 'b2f6ca01-b717-4c08-9aad-1e1d9fceb6b7',
    date: '2025-10-15',
    plant_unit: 'Cement Mill 220',
    information:
      'Ezpro tonasa mengisi ke silo 1\nKlinker dari hopper 1739 dan silo klinker\nSlag murni di bin trass\nTrial semen slag\n',
    created_at: '2025-10-14 16:36:07.754689+00',
    updated_at: '2025-10-15 06:06:33.597072+00',
  },
  {
    idx: 44,
    id: 'b3661493-ffe8-452b-a839-9e5909ad1c54',
    date: '2025-10-18',
    plant_unit: 'Cement Mill 220',
    information: 'Ezpro tonasa mengisi ke silo 1',
    created_at: '2025-10-18 12:26:39.19161+00',
    updated_at: '2025-10-18 12:26:38.677+00',
  },
  {
    idx: 45,
    id: 'b495e250-4677-45f3-8dd5-f983c02a3d19',
    date: '2025-10-16',
    plant_unit: 'Cement Mill 419',
    information: 'Jam 21:30 Stop Fly ash isi bin kosong Mix batu kapur / trass  2:1',
    created_at: '2025-10-16 05:00:32.184047+00',
    updated_at: '2025-10-17 00:33:11.126617+00',
  },
  {
    idx: 46,
    id: 'beebf34d-3734-4057-983b-9e96cfcaed4c',
    date: '2025-10-06',
    plant_unit: 'Cement Mill 220',
    information: '',
    created_at: '2025-10-06 01:25:56.034929+00',
    updated_at: '2025-10-06 05:51:19.152884+00',
  },
  {
    idx: 47,
    id: 'c44f06f5-d7b3-4901-9ef0-9cb14e5617d4',
    date: '2025-10-17',
    plant_unit: 'Cement Mill 419',
    information: 'R45 OVER Dikarnakan speed separator di area 75 -68 untuk mereduce reject> 400',
    created_at: '2025-10-17 00:56:25.754568+00',
    updated_at: '2025-10-17 00:56:25.62+00',
  },
  {
    idx: 48,
    id: 'c5c0190e-810a-47b0-bba0-fc05f7c46d66',
    date: '2025-10-21',
    plant_unit: 'Cement Mill 419',
    information: '22:50 stop pemakaian Flyash isi bin kosong',
    created_at: '2025-10-21 15:38:44.916943+00',
    updated_at: '2025-10-21 15:38:46.657+00',
  },
  {
    idx: 49,
    id: 'cb0d8b21-ea9d-4089-baa1-a3a497bb006c',
    date: '2025-10-20',
    plant_unit: 'Cement Mill 419',
    information: '-23.08 area feed 175 -171 positif inlet mill',
    created_at: '2025-10-19 18:19:53.137628+00',
    updated_at: '2025-10-20 15:12:41.321138+00',
  },
  {
    idx: 50,
    id: 'cceb7524-57e1-4c38-9ab1-bccd3b712af4',
    date: '2025-10-14',
    plant_unit: 'Cement Mill 552',
    information:
      '- Pengaambilan BK dari gudang 5 mulai jam 22.30\n- Feed tertahan, Temperatur outlet  Mill tidak optimal, Temperature cooler drop kiln slow down',
    created_at: '2025-10-14 15:28:16.721505+00',
    updated_at: '2025-10-14 20:30:18.433643+00',
  },
  {
    idx: 51,
    id: 'ceb48882-e6d9-44d8-aa9b-fa9503980e5e',
    date: '2025-10-18',
    plant_unit: 'Cement Mill 320',
    information: 'Ezpro Tonasa silo 1',
    created_at: '2025-10-18 06:57:30.882274+00',
    updated_at: '2025-10-18 12:26:02.991307+00',
  },
  {
    idx: 52,
    id: 'e2c88605-64bd-4322-8b56-8f7d82a3353f',
    date: '2025-10-15',
    plant_unit: 'Cement Mill 420',
    information: 'Jam 08:35 Switch produk dari OPC ke PCC (Level silo 4.2 > 30%)',
    created_at: '2025-10-16 00:08:26.447434+00',
    updated_at: '2025-10-16 00:08:29.809+00',
  },
  {
    idx: 53,
    id: 'e30f7dd7-72e3-467b-9ab6-b08867a7a338',
    date: '2025-10-17',
    plant_unit: 'Cement Mill 420',
    information: 'jam 11:30 reject tinggi> 400 area feed dari 173 -171,speed separator 69 -67',
    created_at: '2025-10-17 00:35:22.310261+00',
    updated_at: '2025-10-17 03:37:55.99208+00',
  },
  {
    idx: 54,
    id: 'e492f8e8-f5ee-4d8b-81ab-c933e0eca968',
    date: '2025-10-21',
    plant_unit: 'Cement Mill 552',
    information:
      '-  Material gypsum di feeder masih kurang lancar\n- Pengambilan filler di gudang 5\n- 16.40-18.00 pindah pengambilan filler ke gudang 2/3, gudang 5 sementara pengisian filler\n- DP MBF 552 masih tinggi diatas 16 mbar',
    created_at: '2025-10-21 07:36:16.684472+00',
    updated_at: '2025-10-21 10:33:26.653211+00',
  },
  {
    idx: 55,
    id: 'eed3fb6d-b3bf-455b-af62-38dcca892578',
    date: '2025-10-11',
    plant_unit: 'Cement Mill 320',
    information:
      '- Ezpro tonasa mengisi ke silo 1\n- feeding menyesuaikan level mill ch 2 tinggi \n- klinker dari hopper 1739 dan silo klinker\n- BK mix tras 2 : 1 di bin bk\n',
    created_at: '2025-10-10 23:35:35.745409+00',
    updated_at: '2025-10-11 14:20:51.985064+00',
  },
  {
    idx: 56,
    id: 'efb0028c-1db1-4572-a2e3-bb76d8954c43',
    date: '2025-10-20',
    plant_unit: 'Cement Mill 420',
    information: 'area feed untuk mengejar kualitas\n14:10  mill mengisi ke silo 3',
    created_at: '2025-10-19 22:32:53.591205+00',
    updated_at: '2025-10-20 06:36:19.359493+00',
  },
  {
    idx: 57,
    id: 'f673c986-b101-4c79-924d-f34ae5e031e7',
    date: '2025-10-10',
    plant_unit: 'Cement Mill 220',
    information: '',
    created_at: '2025-10-10 23:30:57.798441+00',
    updated_at: '2025-10-10 23:31:31.689768+00',
  },
  {
    idx: 58,
    id: 'fc86eed1-651c-46d3-8576-9290add253e2',
    date: '2025-10-15',
    plant_unit: 'Cement Mill 419',
    information:
      'Jam 10:00 R45 > 15% di shift 1 dikarenakan speed separator di turunkan untuk mereduce reject > 300 ton.\nSpeed di naikkan perlahan sesuai penurunan reject\nJam 12:00 R45 masih over, naikkan bertahap speed separator 73% - 75% dan sesuaikan dengan reject mill\nJam 18;00 turunkan speed ke 73%, reject > 300 tph.',
    created_at: '2025-10-16 00:00:51.190411+00',
    updated_at: '2025-10-18 23:17:38.761817+00',
  },
];

async function insertCcrInformationData() {
  try {
    // Create a separate PocketBase instance for bulk operations (bypassing throttling)
    const pb = new PocketBase('http://141.11.25.69:8090');

    // Authenticate as admin
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');
    logger.info('✅ Connected to PocketBase (bulk insertion mode)');

    logger.info(`Starting insertion of ${ccrInformationData.length} CCR information records...`);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Process in small batches to avoid overwhelming the network
    const batchSize = 1; // Reduced to 1 record per batch for extreme network conditions
    for (let i = 0; i < ccrInformationData.length; i += batchSize) {
      const batch = ccrInformationData.slice(i, i + batchSize);
      logger.info(
        `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(ccrInformationData.length / batchSize)} (${batch.length} records)`
      );

      const batchPromises = batch.map(async (record) => {
        try {
          // Prepare the data for insertion (remove idx and id fields as PocketBase generates its own 15-char IDs)
          const { idx, id, ...dataToInsert } = record;

          // Insert the record
          await pb.collection('ccr_information').create(dataToInsert);
          successCount++;
          logger.info(`Successfully inserted record ${record.idx} (ID: ${record.id})`);
        } catch (error) {
          errorCount++;
          const errorMsg = `Failed to insert record ${record.idx} (ID: ${record.id}): ${error.message}`;
          errors.push(errorMsg);
          logger.error(errorMsg);
        }
      });

      // Wait for the current batch to complete before starting the next one
      await Promise.all(batchPromises);

      // Long delay between batches for extreme network conditions
      if (i + batchSize < ccrInformationData.length) {
        await new Promise((resolve) => setTimeout(resolve, 3000)); // 3 second delay
      }
    }

    logger.info(`Insertion completed. Success: ${successCount}, Errors: ${errorCount}`);

    if (errors.length > 0) {
      logger.error('Errors encountered:');
      errors.forEach((error) => logger.error(`- ${error}`));
    }

    return { successCount, errorCount, errors };
  } catch (error) {
    logger.error('Script failed:', error);
    throw error;
  }
}

// Run the insertion if this script is executed directly
if (require.main === module) {
  insertCcrInformationData()
    .then((result) => {
      logger.info(
        `Script completed with ${result.successCount} successes and ${result.errorCount} errors`
      );
      process.exit(result.errorCount > 0 ? 1 : 0);
    })
    .catch((error) => {
      logger.error('Script failed:', error);
      process.exit(1);
    });
}

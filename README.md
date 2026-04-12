# iot-environment-monitoring

## Backend Health Check

Da kiem tra backend va sua cac loi runtime chinh:

- Fix import sai model (`DataSensor` -> `SensorData`, `Action` -> `ActionHistory`).
- Bo sung import `AppError` thieu trong data sensor controller.
- Dong bo `include` voi alias associations (`sensorInfo`, `deviceInfo`).
- Dong bo `foreignKey` trong associations theo model attributes (`sensorId`, `deviceId`).
- Bo sung dependency `node-cron` trong backend package.

Trang thai hien tai:

- Code backend da chay den buoc listen server.
- Blocker con lai: ket noi PostgreSQL (`password authentication failed for user "postgres"`).

## Huong Dan Chay Swagger

### 1) Tao va chinh bien moi truong

Tai thu muc backend `iot-environment-monitoring-be`:

1. Copy file `.env.example` thanh `.env` neu chua co.
2. Chinh cac bien DB cho dung may cua ban:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password
```

Luu y:

- `API_URL` nen de `http://localhost:5000` de Swagger hien dung server URL.

### 2) Cai dependency backend

```bash
cd iot-environment-monitoring-be
npm install
```

### 3) Chay backend

```bash
npm run dev
```

Neu thanh cong, ban se thay log server chay o cong `5000`.

### 4) Mo Swagger UI

Mo trinh duyet tai:

`http://localhost:5000/api-docs`

### 5) Test nhanh cac API trong Swagger

- `GET /sensors`
- `POST /sensors`
- `GET /devices`
- `POST /devices`
- `GET /data-sensors/history`
- `GET /data-sensors/search`
- `POST /actions/control`
- `GET /actions/search`

## Ghi Chu

- Backend da bo logic user/login/auth theo yeu cau.
- Neu van gap loi ket noi DB, kiem tra lai username/password trong `.env` va dich vu PostgreSQL da chay.

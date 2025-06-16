import { ref } from 'vue'

export interface ControllerData {
  leftStick: {
    x: number;
    y: number;
  };
  rightStick: {
    x: number;
    y: number;
  };
  buttons: {
    [key: string]: boolean;
  };
}

export class BluetoothManager {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  
  public isConnected = ref(false);
  public isConnecting = ref(false);
  public error = ref<string | null>(null);

  private readonly SERVICE_UUID = '0000FFE0-0000-1000-8000-00805F9B34FB';
  private readonly CHARACTERISTIC_UUID = '0000FFE1-0000-1000-8000-00805F9B34FB';
  private readonly DEVICE_NAME = 'DroneController';

  public async connect(): Promise<void> {
    try {
      this.isConnecting.value = true;
      this.error.value = null;

      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: this.DEVICE_NAME }],
        optionalServices: [this.SERVICE_UUID]
      });

      const gatt = this.device.gatt;
      if (!gatt) throw new Error('GATT недоступен');
      this.server = await gatt.connect();
      if (!this.server) throw new Error('Не удалось подключиться к GATT серверу');

      const service = await this.server.getPrimaryService(this.SERVICE_UUID);
      this.characteristic = await service.getCharacteristic(this.CHARACTERISTIC_UUID);

      this.isConnected.value = true;
      
      // Подписываемся на отключение
      this.device.addEventListener('gattserverdisconnected', this.onDisconnected);
    } catch (err) {
      this.error.value = err instanceof Error ? err.message : 'Неизвестная ошибка';
      throw err;
    } finally {
      this.isConnecting.value = false;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.server?.connected) {
      this.server.disconnect();
    }
    this.device = null;
    this.server = null;
    this.characteristic = null;
    this.isConnected.value = false;
  }

  private onDisconnected = () => {
    this.isConnected.value = false;
    this.error.value = 'Устройство отключено';
  };

  public async sendData(data: ControllerData): Promise<void> {
    if (!this.characteristic) {
      throw new Error('Нет подключения к устройству');
    }

    const encoder = new TextEncoder();
    const jsonString = JSON.stringify(data);
    const encodedData = encoder.encode(jsonString);
    
    await this.characteristic.writeValue(encodedData);
  }
} 
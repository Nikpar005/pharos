package me.nikpar.pharos;

import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.BatteryManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONObject;

/**
 * Live battery readings for the hidden developer panel (src/screens/Battery.tsx).
 * Web pages can't read the battery current; a native app can.
 * No permissions are needed for any of this.
 */
@CapacitorPlugin(name = "BatteryInfo")
public class BatteryInfoPlugin extends Plugin {

    @PluginMethod
    public void read(PluginCall call) {
        Context ctx = getContext();
        JSObject ret = new JSObject();

        BatteryManager bm = (BatteryManager) ctx.getSystemService(Context.BATTERY_SERVICE);
        Object currentMa = JSONObject.NULL;
        if (bm != null) {
            int raw = bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CURRENT_NOW);
            // Integer.MIN_VALUE (or 0) = not supported on this phone.
            // The API says microamperes, but some phones report milliamperes:
            // anything above 20 000 is treated as µA.
            if (raw != Integer.MIN_VALUE && raw != 0) {
                double ma = Math.abs(raw) > 20000 ? raw / 1000.0 : raw;
                currentMa = Math.round(ma);
            }
        }
        ret.put("currentMa", currentMa);

        Intent status = ctx.registerReceiver(null, new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
        Object voltageMv = JSONObject.NULL;
        Object temperatureC = JSONObject.NULL;
        if (status != null) {
            int mv = status.getIntExtra(BatteryManager.EXTRA_VOLTAGE, -1);
            int tenths = status.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, Integer.MIN_VALUE);
            if (mv > 0) voltageMv = mv;
            if (tenths != Integer.MIN_VALUE) temperatureC = tenths / 10.0;
        }
        ret.put("voltageMv", voltageMv);
        ret.put("temperatureC", temperatureC);

        call.resolve(ret);
    }
}

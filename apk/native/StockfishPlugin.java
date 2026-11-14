package io.github.ouailsalem.chesstrainer;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;

/* Runs the native Stockfish binary (shipped as lib/<abi>/libstockfish.so) and talks UCI with it. */
@CapacitorPlugin(name = "Stockfish")
public class StockfishPlugin extends Plugin {
    private Process proc;
    private BufferedWriter out;

    @PluginMethod
    public void start(PluginCall call) {
        try {
            if (proc == null) {
                File bin = new File(getContext().getApplicationInfo().nativeLibraryDir, "libstockfish.so");
                if (!bin.exists()) { call.reject("no stockfish binary for this device"); return; }
                proc = new ProcessBuilder(bin.getAbsolutePath()).redirectErrorStream(true).start();
                out = new BufferedWriter(new OutputStreamWriter(proc.getOutputStream()));
                final BufferedReader in = new BufferedReader(new InputStreamReader(proc.getInputStream()));
                Thread t = new Thread(() -> {
                    try {
                        String line;
                        while ((line = in.readLine()) != null) {
                            JSObject o = new JSObject();
                            o.put("line", line);
                            notifyListeners("line", o);
                        }
                    } catch (Exception ignored) { }
                });
                t.setDaemon(true);
                t.start();
            }
            JSObject r = new JSObject();
            r.put("cores", Runtime.getRuntime().availableProcessors());
            call.resolve(r);
        } catch (Exception e) {
            call.reject(String.valueOf(e.getMessage()));
        }
    }

    @PluginMethod
    public void send(PluginCall call) {
        String cmd = call.getString("cmd", "");
        try {
            if (out == null) { call.reject("not started"); return; }
            out.write(cmd);
            out.write("\n");
            out.flush();
            call.resolve();
        } catch (Exception e) {
            call.reject(String.valueOf(e.getMessage()));
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        try { if (proc != null) proc.destroy(); } catch (Exception ignored) { }
        proc = null; out = null;
        call.resolve();
    }

    @Override
    protected void handleOnDestroy() {
        try { if (proc != null) proc.destroy(); } catch (Exception ignored) { }
    }
}

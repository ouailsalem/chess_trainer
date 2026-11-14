package io.github.ouailsalem.chesstrainer;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AuthPlugin.class);
        super.onCreate(savedInstanceState);
    }
}

import cesiumlanguagewriter.*;

import java.awt.*;
import java.io.*;
import java.util.ArrayList;
import org.json.*;
import org.apache.commons.io.FileUtils;

public class WriteCZML {
    final static int divideNum = 100;
    final static double stepTime = 30 * 24 * 60 * 60 / 10;
    final static JulianDate epoch = new JulianDate(new GregorianDate(1979, 1, 1, 0, 0, 0));
    final static String jsonFile = "lines_part0.json";
    final static String czmlFilePrefix = "part0_";
    final static double pathWidth = 5.0;
    final static double trailTime = 20.0 * stepTime;

    public static void main(String[] args) {
        JSONArray linesJson = null;
        try {
            File file = new File(jsonFile);
            String content = FileUtils.readFileToString(file, "utf-8");
            linesJson = new JSONArray(content);
        } catch (IOException ioe) {
            System.out.println("Got IOException.");
        }

        for (int part = 0; part < divideNum; part++) {
            writePart(linesJson, part);
        }
    }

    private static void writePart(JSONArray linesJson, int partNum) {
        StringWriter sw = new StringWriter();

        CesiumOutputStream output = new CesiumOutputStream(sw);
        output.setPrettyFormatting(true);
        output.writeStartSequence();

        CesiumStreamWriter stream = new CesiumStreamWriter();

        PacketCesiumWriter packet = stream.openPacket(output);
        packet.writeId("document");
        packet.writeVersion("1.0");

        ClockCesiumWriter clock = packet.openClockProperty();
        int pointNum = linesJson.getJSONArray(0).length();
        clock.writeInterval(epoch, epoch.addSeconds(pointNum * stepTime));
        clock.close();

        packet.close();

        for (int i = 0; i < linesJson.length(); i++) {
            packet = stream.openPacket(output);
            packet.writeId(czmlFilePrefix + Integer.toString(i));

            PathCesiumWriter path = packet.openPathProperty();
            path.writeLeadTimeProperty(0.0);
            path.writeTrailTimeProperty(trailTime);
            path.writeResolutionProperty(10 * stepTime);
            path.writeWidthProperty(pathWidth);

            PolylineMaterialCesiumWriter material = path.openMaterialProperty();
            PolylineArrowMaterialCesiumWriter arrow = material.openPolylineArrowProperty();
            arrow.writeColorProperty(Color.WHITE);
            arrow.close();
            material.close();

            path.close();

            int length = linesJson.getJSONArray(0).length();
            int interval = length / divideNum;

            PositionCesiumWriter position = packet.openPositionProperty();

            ArrayList<JulianDate> dates = new ArrayList<>();
            ArrayList<Cartographic> values = new ArrayList<>();

            for (int step = partNum * interval; step < (partNum + 1) * interval; step++) {
                double x = 0.0, y = 0.0, z = 0.0;
                try {
                    x = linesJson.getJSONArray(i).getJSONArray(step).getDouble(0);
                } catch (JSONException exception) {
                    continue;
                }
                try {
                    y = linesJson.getJSONArray(i).getJSONArray(step).getDouble(1);
                } catch (JSONException exception) {
                    continue;
                }
                try {
                    z = linesJson.getJSONArray(i).getJSONArray(step).getDouble(2);
                } catch (JSONException exception) {
                    continue;
                }
                dates.add(epoch.addSeconds(step * stepTime));
                values.add(new Cartographic(x, y, z));
            }

            position.writeCartographicDegrees(dates, values);
            position.close();

            packet.close();
        }

        try {
            sw.close();
            output.writeEndSequence();

            File czmlFile = new File(czmlFilePrefix + Integer.toString(partNum) + ".czml");
            if (!czmlFile.exists()) {
                czmlFile.createNewFile();
            }
            FileWriter fw = new FileWriter(czmlFile.getAbsoluteFile());
            BufferedWriter bw = new BufferedWriter(fw);
            bw.write(sw.toString());
            bw.close();

        } catch (IOException ioe) {
            System.out.println("Got IOException.");
        }
    }
}

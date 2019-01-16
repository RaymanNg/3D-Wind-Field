import java.io.*;
import org.json.*;
import org.apache.commons.io.FileUtils;

public class SplitJSON {
    final static String jsonFile = "lines.json";

    public static void main(String[] args) {
        JSONArray linesJson = null;
        try {
            File file = new File(jsonFile);
            String content = FileUtils.readFileToString(file, "utf-8");
            linesJson = new JSONArray(content);
        } catch (IOException ioe) {
            System.out.println("Got IOException.");
        }

        splitJson(linesJson);
    }

    private static void splitJson(JSONArray linesJson) {
        int linesNum = linesJson.length();
        try {
            int fileNum = 0;
            JSONArray jsonArray = new JSONArray();
            FileWriter fileWriter = new FileWriter("lines_part" + Integer.toString(fileNum) + ".json");
            for (int i = 0; i < linesNum; i++) {
                jsonArray.put(linesJson.getJSONArray(i));
                if ((i + 1) % 1000 == 0) {
                    fileWriter.write(jsonArray.toString());
                    fileWriter.flush();
                    fileWriter.close();
                    fileNum++;
                    jsonArray = new JSONArray();
                    fileWriter = new FileWriter("lines_part" + Integer.toString(fileNum) + ".json");
                }
            }
            if (jsonArray.length() > 0) {
                fileWriter.write(jsonArray.toString());
                fileWriter.flush();
                fileWriter.close();
            }
        } catch (IOException ioe) {
            System.out.println("Got IOException.");
        }
    }
}
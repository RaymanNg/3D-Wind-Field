import java.io.BufferedOutputStream;
import java.io.DataOutputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;

import ucar.ma2.Array;
import ucar.ma2.Index;
import ucar.nc2.NetcdfFile;
import ucar.nc2.Variable;

public class NetCDFToBinary {

    public static void main(String[] args) {
        String filename = "rhum";
        NetcdfFile ncfile = null;
        try {
            ncfile = NetcdfFile.open(filename + ".nc");
            DataOutputStream binary = new DataOutputStream(
                    new BufferedOutputStream(new FileOutputStream(filename + ".bin")));
            writeAsBinary(ncfile, binary);
            binary.flush();
            binary.close();
        } catch (IOException ioe) {
            System.out.println("Got IOException.");
        } finally {
            if (ncfile != null)
                try {
                    ncfile.close();
                } catch (IOException ioe) {
                    System.out.println("Got IOException.");
                }
        }
    }

    private static void writeAsBinary(NetcdfFile ncfile, DataOutputStream binary) {
        String varName = "rhum";
        Variable var = ncfile.findVariable(varName);

        try {
            float offset = (float) ncfile.readAttributeDouble(var, "add_offset", 0.0);
            float scaleFactor = (float) ncfile.readAttributeDouble(var, "scale_factor", 0.0);

            Array data3D = var.read();
            int[] shape = data3D.getShape();

            int totalElement = 1;
            ByteBuffer headerBuffer = ByteBuffer.allocate(shape.length * 2);
            headerBuffer.order(ByteOrder.LITTLE_ENDIAN);
            for (int dimension : shape) {
                totalElement *= dimension;
                headerBuffer.putShort((short) dimension);
            }
            binary.write(headerBuffer.array());

            ByteBuffer dataBuffer = ByteBuffer.allocate(totalElement * 2);
            dataBuffer.order(ByteOrder.LITTLE_ENDIAN);
            Index index = data3D.getIndex();
            for (int time = 0; time < shape[0]; time++) {
                for (int level = 0; level < shape[1]; level++) {
                    for (int lat = 0; lat < shape[2]; lat++) {
                        for (int lon = 0; lon < shape[3]; lon++) {
                            float value = data3D.getFloat(index.set(time, level, lat, lon));
                            value = (value * scaleFactor) + offset;
                            dataBuffer.putShort((short) value);
                        }
                    }
                }
            }
            binary.write(dataBuffer.array());
        } catch (IOException ioe) {
            System.out.println("Got IOException.");
        }
    }
}
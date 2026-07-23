package sys.hris.sims.storage;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private final Cloudinary cloudinary;

    // publicId dibuat konsisten (dipakai "user-{userId}") supaya foto lama
    // otomatis tertimpa saat ganti foto -- tidak ada file menumpuk di Cloudinary.
    public String uploadFoto(MultipartFile file, String publicId) throws IOException {
        Map uploadResult = cloudinary.uploader().upload(
            file.getBytes(),
            ObjectUtils.asMap(
                "folder", "employees",
                "public_id", publicId,
                "overwrite", true,
                "invalidate", true,
                "resource_type", "image"
            )
        );
        return uploadResult.get("secure_url").toString();
    }
}
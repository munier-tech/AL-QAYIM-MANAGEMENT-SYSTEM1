import Teachers from "../models/teachersModel.js";
import cloudinary from "../lib/cloudinary.js";
// 1. Abuur Macallin Cusub
export const createTeacher = async (req, res) => {
  try {
    const { name, number, email, subject } = req.body;
    const profilePictureFile = req.files?.profilePicture?.[0];
    const certificateFile = req.files?.certificate?.[0];

    if (!name || !number || !email || !subject) {
      return res.status(400).json({ message: "Fadlan buuxi dhammaan meelaha loo baahan yahay" });
    }

    const existingTeacher = await Teachers.findOne({ email });
    if (existingTeacher) {
      return res.status(400).json({ message: "Macallin email-kan hore ayaa loo diiwaangaliyay" });
    }

    // ✅ Upload profile picture
    let uploadedProfile = "no profile picture";
    if (profilePictureFile) {
      const uploadResponse = await cloudinary.uploader.upload(
        `data:${profilePictureFile.mimetype};base64,${profilePictureFile.buffer.toString('base64')}`,
        {
          folder: 'teachers/profiles',
          resource_type: 'image'
        }
      );
      uploadedProfile = uploadResponse.secure_url;
    }

    // ✅ Upload certificate
    let uploadedCertificate = "no certificate";
    if (certificateFile) {
      console.log('Certificate file details:', {
        originalname: certificateFile.originalname,
        mimetype: certificateFile.mimetype,
        size: certificateFile.size
      });
      
      // Determine resource type based on file mimetype
      const isPdf = certificateFile.mimetype === 'application/pdf';
      const resourceType = isPdf ? 'raw' : 'image';
      
      console.log('Uploading certificate with settings:', {
        resourceType,
        isPdf,
        folder: 'teachers/certificates'
      });
      
      const certUpload = await cloudinary.uploader.upload(
        `data:${certificateFile.mimetype};base64,${certificateFile.buffer.toString('base64')}`,
        {
          folder: 'teachers/certificates',
          resource_type: resourceType,
          format: isPdf ? 'pdf' : undefined
        }
      );
      
      console.log('Certificate upload result:', {
        secure_url: certUpload.secure_url,
        public_id: certUpload.public_id,
        format: certUpload.format
      });
      
      uploadedCertificate = certUpload.secure_url;
    }

    const teacher = new Teachers({
      name,
      number,
      email,
      subject,
      profilePicture: uploadedProfile,
      certificate: uploadedCertificate
    });

    await teacher.save();
    res.status(201).json({ message: "Macallinka si guul leh ayaa loo abuuray", teacher });

  } catch (error) {
    console.error("Error in createTeacher function:", error);
    res.status(500).json({ message: error.message });
  }
};



// 2. Hel Dhammaan Macallimiinta
export const getAllTeachers = async (req, res) => {
  try {
    const teacher = await Teachers.find({}).sort({ createdAt: -1 });
    res.status(200).json({ message: "Macallimiinta si guul leh ayaa loo helay", teachers: teacher });
  } catch (error) {
    console.error("Error in getAllTeachers function: ", error);
    res.status(500).json({ message: error.message });
  }
};


// 3. Hel Macallin Hal Qof ah (ID)
export const getTeacherById = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const teacher = await Teachers.findById(teacherId);

    if (!teacher) {
      return res.status(404).json({ message: "Macallin lama helin" });
    }

    res.status(200).json({ message: "Macallinka si guul leh ayaa loo helay", teacher });
  } catch (error) {
    console.error("Error in getTeacherById function: ", error);
    res.status(500).json({ message: error.message });
  }
};




export const updateTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { name, number, email, subject } = req.body;
    const profilePictureFile = req.files?.profilePicture?.[0];
    const certificateFile = req.files?.certificate?.[0];

    const teacher = await Teachers.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: "Macallin lama helin" });
    }

    // ✅ Update profile picture if provided
    if (profilePictureFile) {
      if (teacher.profilePicture && teacher.profilePicture !== "no profile picture") {
        const publicId = teacher.profilePicture.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId); // remove old picture
      }
      const uploadRes = await cloudinary.uploader.upload(
        `data:${profilePictureFile.mimetype};base64,${profilePictureFile.buffer.toString('base64')}`,
        {
          folder: 'teachers/profiles',
          resource_type: 'image'
        }
      );
      teacher.profilePicture = uploadRes.secure_url;
    }

    // ✅ Update certificate if provided
    if (certificateFile) {
      if (teacher.certificate && teacher.certificate !== "no certificate") {
        const certId = teacher.certificate.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(certId); // remove old file
      }
      
      // Determine resource type based on file mimetype
      const isPdf = certificateFile.mimetype === 'application/pdf';
      const resourceType = isPdf ? 'raw' : 'image';
      
      const certRes = await cloudinary.uploader.upload(
        `data:${certificateFile.mimetype};base64,${certificateFile.buffer.toString('base64')}`,
        {
          folder: 'teachers/certificates',
          resource_type: resourceType,
          format: isPdf ? 'pdf' : undefined
        }
      );
      teacher.certificate = certRes.secure_url;
    }

    // ✅ Update text fields
    teacher.name = name || teacher.name;
    teacher.number = number || teacher.number;
    teacher.email = email || teacher.email;
    teacher.subject = subject || teacher.subject;

    await teacher.save();

    res.status(200).json({ message: "Macallinka si guul leh ayaa loo cusboonaysiiyay", teacher });

  } catch (error) {
    console.error("Error in updateTeacher function:", error);
    res.status(500).json({ message: error.message });
  }
};



// 5. Tirtir Macallin
export const deleteTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const teacher = await Teachers.findByIdAndDelete(teacherId);

    if (!teacher) {
      return res.status(404).json({ message: "Macallin lama helin" });
    }

    // Tirtir sawirka haddii uu jiro
    if (teacher.profilePicture && teacher.profilePicture !== "no profile picture") {
      const publicId = teacher.profilePicture.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(publicId);
    }

    res.status(200).json({ message: "Macallinka si guul leh ayaa loo tirtiray" });
  } catch (error) {
    console.error("Error in deleteTeacher function: ", error);
    res.status(500).json({ message: error.message });
  }
};

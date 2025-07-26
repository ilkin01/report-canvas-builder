import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { updateUserProfile, uploadProfilePhoto } from "@/redux/slices/authSlice";
import { apiService } from "@/services/apiService";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Settings = () => {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const isLoading = useAppSelector(state => state.auth.isLoading);
  const [profile, setProfile] = useState({
    name: "",
    surname: "",
    email: "",
    phoneNumber: "",
    avatarUrl: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || "",
        surname: user.surname || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        avatarUrl: user.avatarUrl || "",
      });
    }
  }, [user]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAvatarSaveClick = () => {
    if (editMode) {
      fileInputRef.current?.click();
    }
  };
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
      setProfile((prev) => ({ ...prev, avatarUrl: URL.createObjectURL(e.target.files[0]) }));
      toast.success(t('settings.profilePhotoSaved'));
    }
  };

  const saveAvatar = async () => {
    if (!avatarFile) {
      // Əgər şəkil seçilməyibsə, file input açılsın
      fileInputRef.current?.click();
      return;
    }
    setSaving(true);
    try {
      const resultAction = await dispatch(uploadProfilePhoto(avatarFile));
      if (uploadProfilePhoto.fulfilled.match(resultAction)) {
        toast.success(t('settings.profilePhotoSaved'));
        setAvatarFile(null);
        if (resultAction.payload?.avatarUrl) {
          setProfile((prev) => ({ ...prev, avatarUrl: resultAction.payload.avatarUrl }));
        }
      } else {
        toast.error(t('settings.profilePhotoError'));
      }
    } catch (err) {
      toast.error(t('settings.profilePhotoError'));
    }
    setSaving(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const resultAction = await dispatch(updateUserProfile({
        name: profile.name,
        surname: profile.surname,
        email: profile.email,
        phoneNumber: profile.phoneNumber,
      }));
      if (updateUserProfile.fulfilled.match(resultAction)) {
        toast.success(t('settings.profileSaved'));
        setEditMode(false);
      } else {
        toast.error(t('settings.profileSaveError'));
      }
    } catch (err) {
      toast.error(t('settings.profileSaveError'));
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-white to-yellow-50 py-10">
      {/* Back to Dashboard Button */}
      <div className="w-full max-w-4xl flex justify-start mb-6 mt-2">
        <button
          onClick={() => navigate("/")}
          className="px-4 py-1 rounded-md border border-blue-300 text-blue-700 bg-white font-semibold shadow-sm hover:bg-blue-50 transition-all text-sm"
        >
          ← {t('settings.backToDashboard')}
        </button>
      </div>
      <div className="w-full max-w-4xl space-y-8">
        {/* Profile Card */}
        <Card className="rounded-3xl shadow-2xl border-0 bg-white/80 backdrop-blur-md p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            {/* Avatar & Info */}
            <div className="flex flex-col items-center gap-4 md:w-1/3 pt-6">
              <Avatar className="w-24 h-24 shadow-lg border-4 border-blue-100">
                <AvatarImage src={profile.avatarUrl} alt="Profil şəkli" />
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-2xl font-bold">
                  {profile.name.charAt(0)}{profile.surname.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarFileChange}
              />
              <Button
                className="w-full mt-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold shadow-lg hover:from-blue-600 hover:to-blue-800 transition-all text-base tracking-wide"
                onClick={saveAvatar}
                type="button"
              >
                {saving ? t('common.loading') : t('settings.saveProfilePhoto')}
              </Button>
              {/* Removed name and email text under avatar for a cleaner look */}
            </div>
            {/* Profile Fields */}
            <form className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-500 text-sm mb-1">{t('settings.name')}</label>
                <Input name="name" value={profile.name} onChange={handleProfileChange} disabled={!editMode} className="rounded-lg bg-gray-50 border-0 focus:ring-2 focus:ring-blue-200 h-12" />
              </div>
              <div>
                <label className="block text-gray-500 text-sm mb-1">{t('settings.surname')}</label>
                <Input name="surname" value={profile.surname} onChange={handleProfileChange} disabled={!editMode} className="rounded-lg bg-gray-50 border-0 focus:ring-2 focus:ring-blue-200 h-12" />
              </div>
              <div>
                <label className="block text-gray-500 text-sm mb-1">{t('settings.phone')}</label>
                <Input name="phoneNumber" value={profile.phoneNumber} onChange={handleProfileChange} disabled={!editMode} className="rounded-lg bg-gray-50 border-0 focus:ring-2 focus:ring-blue-200 h-12" />
              </div>
              <div>
                <label className="block text-gray-500 text-sm mb-1">{t('settings.email')}</label>
                <Input name="email" value={profile.email} onChange={handleProfileChange} disabled={!editMode} className="rounded-lg bg-gray-50 border-0 focus:ring-2 focus:ring-blue-200 h-12" />
              </div>
            </form>
            {/* Edit/Save Button */}
            <div className="flex flex-col items-end md:items-center md:justify-center md:w-32 mt-4 md:mt-0">
              {!editMode ? (
                <Button className="w-24 h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold" onClick={() => setEditMode(true)}>
                  {t('settings.edit')}
                </Button>
              ) : (
                <Button className="w-24 h-11 bg-green-600 hover:bg-green-700 text-white font-semibold" onClick={handleSave} disabled={saving || isLoading}>
                  {saving ? <span className="animate-spin mr-2 inline-block w-5 h-5 border-2 border-white border-t-green-400 rounded-full align-middle"></span> : null}
                  {t('settings.save')}
                </Button>
              )}
            </div>
          </div>
          {/* Removed My email Address section */}
        </Card>
      </div>
    </div>
  );
};

export default Settings; 
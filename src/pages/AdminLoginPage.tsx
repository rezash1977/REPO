import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, User, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const loginSchema = z.object({
  email: z.string().email({ message: "ایمیل نامعتبر است" }),
  password: z.string().min(8, { message: "رمز عبور باید حداقل ۸ کاراکتر باشد" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error || !authData.user) {
        toast({
          title: "خطا در ورود",
          description: error?.message || "ایمیل یا رمز عبور اشتباه است",
          variant: "destructive",
        });
        return;
      }
      // بررسی نقش ادمین
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authData.user.id)
        .eq('role', 'admin')
        .single();
      if (roleData && !roleError) {
        toast({
          title: "ورود موفقیت‌آمیز",
          description: "به پنل مدیریت خوش آمدید",
          variant: "default",
        });
        navigate("/admin");
      } else {
        await supabase.auth.signOut();
        toast({
          title: "دسترسی غیرمجاز",
          description: "شما ادمین نیستید!",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطا در ورود",
        description: "خطای غیرمنتظره‌ای رخ داد. لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (loading) return;
      if (!user) {
        navigate('/login');
        return;
      }
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();
        if (data && !error) {
          setIsAdmin(true);
        } else {
          toast({
            title: "دسترسی غیرمجاز",
            description: "شما دسترسی به پنل مدیریت ندارید",
            variant: "destructive",
          });
          navigate('/');
        }
      } catch (error) {
        toast({
          title: "دسترسی غیرمجاز",
          description: "شما دسترسی به پنل مدیریت ندارید",
          variant: "destructive",
        });
        navigate('/');
      } finally {
        setChecking(false);
      }
    };
    checkAdminAccess();
  }, [user, loading, navigate, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold text-violet-600">ورود ادمین</CardTitle>
          <CardDescription className="text-gray-500">
            فقط ادمین‌ها می‌توانند وارد این بخش شوند
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium flex items-center gap-2">
                      <User className="h-4 w-4 text-fuchsia-600" />
                      ایمیل
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="example@email.com"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium flex items-center gap-2">
                      <Lock className="h-4 w-4 text-fuchsia-600" />
                      رمز عبور
                    </FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="********"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 hover:text-violet-600"
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-lg py-6"
                disabled={isLoading}
              >
                {isLoading ? "در حال ورود..." : "ورود ادمین"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-6">
          <p className="text-gray-500 text-sm">
            فقط ادمین‌ها مجاز به ورود هستند
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminLoginPage; 